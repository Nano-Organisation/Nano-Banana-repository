
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

// Initialize Supabase Client
// We try VITE_ prefix first (common in React apps) then standard env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: Request) {
  // CORS Headers to allow requests from your frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { userId, model, contents, config } = await req.json();

    if (!process.env.API_KEY) {
       throw new Error("Server API_KEY configuration missing");
    }

    // 1. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Validate User & Credits (Only if userId is provided and Supabase is configured)
    if (userId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', userId)
        .single();

      if (!profileError && profile) {
        // Calculate Cost dynamically based on model type
        let cost = 1; // Default Text
        if (model.includes('image')) cost = 5;
        if (model.includes('video') || model.includes('veo')) cost = 50;

        if (profile.credit_balance < cost) {
           return new Response(JSON.stringify({ error: "Insufficient credits for this operation." }), { 
             status: 402,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
           });
        }

        // Deduct Credits
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ credit_balance: profile.credit_balance - cost })
          .eq('id', userId);
          
        if (updateError) {
            console.error("Failed to deduct credits:", updateError);
        }
      }
    }

    // 3. Generate Content
    // This supports both text and image generation via generateContent
    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    // 4. Return Result
    // We return the full response object structure so the frontend code doesn't need to change much
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error",
      details: error.toString() 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

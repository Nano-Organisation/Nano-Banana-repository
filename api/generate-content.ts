
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

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
    // We now accept 'action', 'operationName', and spread other params
    const body = await req.json();
    const { userId, model, action, operationName, ...rest } = body;

    if (!process.env.API_KEY) {
       throw new Error("Server API_KEY configuration missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- HANDLE POLLING (No credit cost) ---
    if (action === 'poll' && operationName) {
        // operationName is a string like "projects/.../operations/..."
        // The SDK expects { name: string }
        const operation = await ai.operations.getVideosOperation({ name: operationName });
        return new Response(JSON.stringify(operation), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // --- HANDLE GENERATION (Credit Check Required) ---
    
    // 1. Calculate Cost
    let cost = 1; // Default Text
    if (model?.includes('image')) cost = 5;
    if (model?.includes('veo') || model?.includes('video')) cost = 50;

    // 2. Validate Credits
    if (userId && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', userId)
        .single();

      if (!profileError && profile) {
        // Admin Bypass (Optional: if you have an admin flag in DB, check it here. 
        // For now, we assume all users pay credits)
        
        if (profile.credit_balance < cost) {
           return new Response(JSON.stringify({ error: `Insufficient credits. This task requires ${cost} credits.` }), { 
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

    // 3. Execute Model Call
    let response;

    if (model?.includes('veo')) {
        // Video Generation
        // Pass 'prompt', 'config', etc. directly from 'rest'
        // The Service sends: { prompt, config, image?, ... } inside 'rest'
        response = await ai.models.generateVideos({
            model,
            ...rest
        });
    } else {
        // Text/Image Generation
        // Service sends: { contents, config } inside 'rest'
        response = await ai.models.generateContent({
            model,
            ...rest
        });
    }

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

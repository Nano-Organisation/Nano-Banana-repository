import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
// Fix: Added STORAGE_SUPABASE_SERVICE_ROLE_KEY to match the specific Vercel environment variable name provided in the screenshot
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

    // CRITICAL: Strict User ID Enforcement
    // If we don't have a userId, we cannot bill. 
    // In a real app, you might decode a JWT here. 
    // For this implementation, we require the ID string to be present.
    if (!userId) {
       return new Response(JSON.stringify({ error: "Unauthorized: Missing User ID. Please login or reset your session." }), { 
         status: 401,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       });
    }

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
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
         // Fail securely if we can't verify credits
         return new Response(JSON.stringify({ error: "Authentication Error: User profile not found." }), { 
             status: 403,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         });
      }

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
          // Optional: Return error to prevent free usage on DB fail? 
          // For now, log it. Strict mode would be `throw updateError`.
      }
    }

    // 3. Execute Model Call
    let response;

    if (model?.includes('veo')) {
        // Video Generation
        // Pass 'prompt', 'config', etc. directly from 'rest'
        // The Service sends: { prompt, config, image?, ... } inside 'rest'
        const videoOp = await ai.models.generateVideos({
            model,
            ...rest
        });
        // Explicitly map the operation name to a plain object for JSON serialization
        response = { name: videoOp.name };
    } else {
        // Text/Image Generation
        // Service sends: { contents, config } inside 'rest'
        response = await ai.models.generateContent({
            model,
            ...rest
        });
        
        // Fix: Explicitly return the name if it's an operation (for long running tasks that aren't VEO)
        // However, standard generateContent returns the result immediately.
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
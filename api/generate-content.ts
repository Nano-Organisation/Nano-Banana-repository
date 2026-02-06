import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
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
    const body = await req.json();
    const { userId, model, action, operationName, ...rest } = body;

    // 1. Strict User ID Enforcement
    if (!userId) {
       return new Response(JSON.stringify({ error: "Unauthorized: Missing User ID." }), { 
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
        // Cast to any to bypass TS2353 error where SDK definition lags behind runtime support
        const operation = await ai.operations.getVideosOperation({ name: operationName } as any);
        return new Response(JSON.stringify(operation), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // --- HANDLE GENERATION (Credit Check & Deduct) ---
    
    // 2. Calculate Cost
    let cost = 1;
    if (model?.includes('image')) cost = 5;
    if (model?.includes('veo') || model?.includes('video')) cost = 50;

    // 3. CHECK BALANCE (Read-Only)
    // CRITICAL: Skip if it's an admin or license session (pre-paid/unlimited)
    if (!userId.startsWith('admin-') && !userId.startsWith('license-')) {
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credit_balance')
            .eq('id', userId)
            .single();

          if (profileError || !profile) {
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
        }
    }

    // 4. EXECUTE MODEL CALL (The risky part)
    let response;

    if (model?.includes('veo')) {
        let videoOp;
        try {
            videoOp = await ai.models.generateVideos({
                model,
                ...rest
            });
        } catch (sdkError: any) {
            console.error("Google GenAI SDK Error:", sdkError);
            // If SDK fails, we throw here. Code jumps to 'catch'. Credits are NOT deducted.
            throw new Error(`SDK Execution Failed: ${sdkError.message}`);
        }
        
        // CRITICAL FIX: The Guard Clause
        // If Veo returns undefined or a partial object without a name, we stop.
        if (!videoOp || !videoOp.name) {
            throw new Error("Video generation failed: No operation returned from provider.");
        }
        
        // Safe to access .name now
        response = { name: videoOp.name };
    } else {
        // Standard text/image generation
        response = await ai.models.generateContent({
            model,
            ...rest
        });
    }

    // 5. DEDUCT CREDITS (Only reached if Step 4 succeeded)
    // Only deduct for standard users
    if (!userId.startsWith('admin-') && !userId.startsWith('license-')) {
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Re-fetch to ensure we don't go negative in a race condition (optional but safe)
          const { data: currentProfile } = await supabase.from('profiles').select('credit_balance').eq('id', userId).single();
          
          if (currentProfile) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ credit_balance: currentProfile.credit_balance - cost })
                .eq('id', userId);
                
              if (updateError) {
                  console.error("CRITICAL: Failed to deduct credits after successful generation:", updateError);
              }
          }
        }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("API Error:", error);
    
    // Improved Status Mapping for Quota Errors
    const status = error.status || 500;
    const isQuotaError = status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
    const finalStatus = isQuotaError ? 429 : 500;

    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error",
      details: error.toString() 
    }), {
      status: finalStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

import { createClient } from '@supabase/supabase-js';

// Prioritize Vite-compatible keys (VITE_...), fall back to Next.js style keys if necessary
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY;

// Only initialize if keys are present to avoid "supabaseUrl is required" error
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getUserProfile = async (userId: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return null;
  return data;
};

export const createInitialProfile = async (userId: string, email: string) => {
  if (!supabase) return { error: new Error("Supabase not initialized") };
  const { error } = await supabase
    .from('profiles')
    .insert([
      { id: userId, email: email, credit_balance: 500 }
    ]);
  
  return { error };
};

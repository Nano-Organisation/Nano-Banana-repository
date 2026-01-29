
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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

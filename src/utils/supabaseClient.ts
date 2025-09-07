import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client instance
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for text normalization (if needed elsewhere)
export const normalizeText = (text: string): string => {
  return text.toLowerCase().trim();
};

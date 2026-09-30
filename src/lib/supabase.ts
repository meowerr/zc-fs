import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-zcfs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key_for_local_development';

export const isLiveSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder-zcfs.supabase.co' && 
  supabaseAnonKey !== 'dummy_anon_key_for_local_development';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

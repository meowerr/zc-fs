import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-zcfs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key_for_local_development';

// Mock layer is strictly restricted to DEV and explicit VITE_DEMO_MODE=true
export const isDemoMode = Boolean(import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true');

export const isLiveSupabaseConfigured = 
  !isDemoMode &&
  supabaseUrl !== 'https://placeholder-zcfs.supabase.co' && 
  supabaseAnonKey !== 'dummy_anon_key_for_local_development';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

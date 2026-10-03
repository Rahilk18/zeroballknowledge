import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const isSupabaseConfigured = 
  Boolean(import.meta.env.VITE_SUPABASE_URL) && 
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials not configured in .env.local. The app will run in standalone/demo mode. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable full live multiplayer cloud sync.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type { User, Session } from '@supabase/supabase-js';

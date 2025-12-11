import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ogyhuuwutoovkiqcgkmx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9neWh1dXd1dG9vdmtpcWNna214Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODE1NjYsImV4cCI6MjA3MjU1NzU2Nn0.qBTeJwarTHlGVjQ2WrCzzRyj3_bP56nQhKS4mA8gh-g';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'starscale.supabase.auth',
  },
});

export default customSupabaseClient;

export {
  customSupabaseClient,
  customSupabaseClient as supabase,
};

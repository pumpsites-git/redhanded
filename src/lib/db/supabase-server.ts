import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client.
 * Uses the anon key for now; upgrade to service role key when RLS is configured.
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use service role key to bypass RLS in backend APIs (e.g. webhook, admin manual verify)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktsnpkpcojtypqmfskit.supabase.co';
// Auto-correct typo if 'f' was entered instead of 't' in project ID
const supabaseUrl = rawUrl.replace('kfsnpkpcojfypqmfskif', 'ktsnpkpcojtypqmfskit');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use service role key to bypass RLS in backend APIs (e.g. webhook, admin manual verify)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

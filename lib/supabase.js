import { createClient } from '@supabase/supabase-js';

const isDev = process.env.NODE_ENV !== 'production';

// In production, require strict environment variables. In dev, allow local fallback.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (isDev ? 'https://kfsnpkpcojfypqmfskif.supabase.co' : '');

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (isDev ? 'sb_publishable_uCdoAw2Gk9E5iVzGgKhQiQ_HPEF6wz_' : '');

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  (isDev ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' : '');

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    console.warn('[Supabase Config Warning] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Service role client to bypass RLS in authorized backend API route handlers
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder'
);

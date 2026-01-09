import { createClient } from '@supabase/supabase-js';

// ここに型定義を追加します
export interface GratitudePost {
  id: string;
  content: string;
  created_at: string;
}

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

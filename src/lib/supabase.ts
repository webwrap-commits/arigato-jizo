import { createClient } from '@supabase/supabase-js';

export interface GratitudePost {
  id: string;
  content: string;
  name: string;
  ai_reply: string | null;
  created_at: string;
}

// 直接、あなたの情報を書き込みます
const supabaseUrl ='https://jvutxraxzpolmoypgvdh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2dXR4cmF4enBvbG1veXBndmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjQ0MTQsImV4cCI6MjA4MDQwMDQxNH0.nzz9va3Uy0s-LPvb7PzvotFGWoRq9BepaGG5t5WEsBc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

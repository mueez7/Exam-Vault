// src/lib/supabase.ts
// Supabase client singleton — import this everywhere you need DB/storage access.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "[ExamVault] Missing Supabase env vars. " +
      "Copy frontend/.env.example → frontend/.env.local and fill in your project values.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

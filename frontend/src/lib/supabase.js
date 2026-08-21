import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) || "https://jeafkfarfkojazznsafj.supabase.co";
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) || "sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

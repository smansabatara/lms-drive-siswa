import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://adskvvqjftargnjzcxcs.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkc2t2dnFqZnRhcmduanpjeGNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MDM4ODgsImV4cCI6MjEwNDI3OTg4OH0.Os7gEciBM3K5fXrewrw01tudfu34ux8264UQQLV8ZK0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
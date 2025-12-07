// lib/supabase.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto"; // ⭐ REQUIRED FIRST LINE

const SUPABASE_URL = "https://fiisnavnxathhgyhzsmk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpaXNuYXZueGF0aGhneWh6c21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDY1NjYsImV4cCI6MjA3NzU4MjU2Nn0.AuzljZ5rDCM7ulGOLLpOQTXu-zH6EfC5VEz6WV-Ji5g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
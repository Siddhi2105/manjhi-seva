import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://amonzctqcatldhgpmjgy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtb256Y3RxY2F0bGRoZ3Btamd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzY3NzksImV4cCI6MjA5MzI1Mjc3OX0.LeYTHOfCv7bT03CzssQMgIgewYf_XOmblwLPw-O2iYU";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
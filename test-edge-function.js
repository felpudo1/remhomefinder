import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://cuyfrpuiokvqvhvoerga.supabase.co";
// Need service role key, but we only have anon key in .env. We will try to call the edge function directly.
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWZycHVpb2t2cXZodm9lcmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDgxMjUsImV4cCI6MjA5MDAyNDEyNX0.ErCSJvCwcI24b3GG-ZYvq29XCV27wN1mxvO6Uk3ocac";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEdgeFunction() {
  console.log("Calling get-system-metrics edge function...");
  
  // To call this, we typically need a valid user session.
  // Since we don't have one easily locally without logging in, we'll try to just ping it or see the error.
  const { data, error } = await supabase.functions.invoke("get-system-metrics");
  
  if (error) {
     console.error("Function Error:", error);
  } else {
     console.log("Function Data:", data);
  }
}

testEdgeFunction();

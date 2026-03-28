import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cuyfrpuiokvqvhvoerga.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eWZycHVpb2t2cXZodm9lcmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDgxMjUsImV4cCI6MjA5MDAyNDEyNX0.ErCSJvCwcI24b3GG-ZYvq29XCV27wN1mxvO6Uk3ocac'
);

async function checkHistory() {
  console.log("Fetching history...");
  const { data, error } = await supabase
    .from('system_metrics_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('History:', data);
  }
}

checkHistory();

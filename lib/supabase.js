
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if values are available
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key missing. Check your environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Add basic logging for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
});

export default supabase;

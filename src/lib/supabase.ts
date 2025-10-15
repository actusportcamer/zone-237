import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://akrhrziycsbxnxvozdhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcmhyeml5Y3NieG54dm96ZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjk4NzAsImV4cCI6MjA3NDg0NTg3MH0.-VWBYz3ZDScRyf5rgUw2RXPqGtnq-dtZz8wVwIrY55g';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

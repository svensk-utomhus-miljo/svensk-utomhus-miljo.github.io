import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://braveivovmjoohyhufwe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYXZlaXZvdm1qb29oeWh1ZndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Njc5MjMsImV4cCI6MjA3MzU0MzkyM30.MVpbpkWPqZ4xMJogWhx1cPkFm07FogbZe5uXPmVEnU8'
)

export {
  supabase
}
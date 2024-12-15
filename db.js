import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient(
  'https://ufvhoqbeacsvboztiwyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdmhvcWJlYWNzdmJvenRpd3lwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzYxODk2MSwiZXhwIjoyMDQ5MTk0OTYxfQ.YtjZO0Gd35ZdqMxF5z2qLSgkeXiuvXWt9QU0v4Dtcuo'
)

export {
  supabase
}
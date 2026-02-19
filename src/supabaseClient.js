import { createClient } from '@supabase/supabase-js'

// 正確的雲端倉庫設定
const supabaseUrl = 'https://wzgtwaryzdlcnbrgchtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z3R3YXJ5emRsY25icmdjaHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTQxMDYsImV4cCI6MjA4NzAzMDEwNn0.vyeMLkBoWtT_F2UulfmFVZrWlhi3-nIbY8YbFHF0zsE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

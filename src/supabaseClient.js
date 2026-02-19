import { createClient } from '@supabase/supabase-js'

// 請前往 https://supabase.com/ 註冊專案並取得以下資訊
// 在 Dashboard -> Settings -> API 頁面下
const supabaseUrl = 'https://wzgtrwaryzdlcnbrgchtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6Z3R3YXJ5emRsY25icmdjaHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTQxMDYsImV4cCI6MjA4NzAzMDEwNn0.vyeMLkBoWtT_F2UulfmFVZrWlhi3-nIbY8YbFHF0zsE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

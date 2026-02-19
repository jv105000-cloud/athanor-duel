import { createClient } from '@supabase/supabase-js'

// 請前往 https://supabase.com/ 註冊專案並取得以下資訊
// 在 Dashboard -> Settings -> API 頁面下
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

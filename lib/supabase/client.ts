// Browser Supabase client using @supabase/ssr.
// Mengembalikan null bila env Supabase tidak terpasang — aplikasi lalu
// berjalan dalam mode demo (lib/demo/*). Dulu fungsi ini memakai `!`
// sehingga build/prerender CRASH ("Your project's URL and API key are
// required") di semua halaman yang me-render Sidebar, padahal build
// harus lolos tanpa kredensial. Pemanggil wajib menangani null.
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/config'

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server Supabase client using @supabase/ssr.
// CATATAN: file ini HANYA dipakai saat aplikasi dijalankan sebagai server
// Next.js (dev `next start` / self-host). Deployment Cloudflare Pages
// memakai static export + worker/_worker.js — worker tidak mengimpor
// file ini dan callback auth ditangani worker (GET /auth/callback).
// Jangan impor file ini dari komponen klien (next/headers tidak ada
// di browser).
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

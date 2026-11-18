// DocSumm — runtime config.
// Satu-satunya sumber kebenaran apakah mode Supabase (akun + database)
// aktif. Tanpa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// aplikasi berjalan dalam MODE DEMO: tanpa akun, dokumen + template
// disimpan di localStorage, dan ringkasan dibuat worker /api/summarize
// (AI bila OPENROUTER_API_KEY terpasang di Pages, kalau tidak pakai
// ringkasan ekstraktif lokal). Lihat docs/DEMO.md.

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  if (url.includes('placeholder') || key.includes('placeholder')) return false
  return url.startsWith('https://')
}

export function getSupabaseUrl(): string | null {
  return isSupabaseConfigured() ? process.env.NEXT_PUBLIC_SUPABASE_URL! : null
}

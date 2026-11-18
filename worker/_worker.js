// Cloudflare Pages _worker.js — DocSumm.
//
// Aplikasi Next.js adalah static export (`output: 'export'`), jadi tidak
// bisa membawa route handler dinamis: `next build` menolak /api/*,
// /auth/callback, dan middleware saat static export. Worker ini adalah
// server produksi untuk semua itu, dan menyajikan sisanya dari static
// export lewat binding ASSETS.
//
// BUG YANG DIPERBAIKI FILE INI: frontend selalu memanggil
// POST /api/summarize, tapi route itu hanya placeholder 501 — tidak ada
// satu pun dokumen yang pernah selesai diproses. /api/summarize kini
// benar-benar ada, dengan dua mesin:
//   1. AI (bila secret OPENROUTER_API_KEY terpasang di Pages):
//      OCR gambar via Gemini Vision + ringkasan terstruktur via
//      Gemini Flash — prompt yang sama dengan lib/openrouter/*.
//   2. Ekstraktif (tanpa kunci): ringkasan deterministik dari teks
//      itu sendiri (kalimat pembuka + kalimat berkata-kunci + tanggal).
//      Jujur dilabeli `engine: "extractive"` di respons; halaman hasil
//      menampilkannya sebagai "ringkasan otomatis (tanpa AI)".
//
// Mode demo: tanpa Supabase, upload + penyimpanan dokumen dikerjakan
// client di localStorage (lib/demo/*); worker hanya merangkum.
// Mode Supabase: client memakai Supabase langsung (Storage + tabel);
// worker tidak butuh service_role key.
//
// Secret yang dibaca worker (di-set di dashboard Pages / API, TIDAK
// pernah di-commit): OPENROUTER_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY. Lihat docs/DEPLOYMENT.md.

const MAX_TEXT_CHARS = 120_000;
const MAX_IMAGE_BYTES = 8_000_000;

// ---------------------------------------------------------------------------
// Ringkasan ekstraktif (pure — unit-tested). Tanpa AI, tanpa network.
// ---------------------------------------------------------------------------
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;
const CRITICAL_RE =
  /(penting|kritis|segera|wajib|harus|risiko|bahaya|denda|batas|deadline|korosi|rusak|perhatian|urgent|critical|must|shall|required|severe)/i;
const ACTION_RE =
  /(lakukan|perbaiki|jadwalkan|hubungi|kirim|bayar|periksa|ganti|siapkan|selesaikan|tinjau|ukur|pasang|bersihkan|ganti|atur|mohon|diminta|disarankan|direkomendasikan|please|schedule|contact|send|pay|check|replace|prepare|review)/i;
const DATE_RE =
  /\b\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Jan|Feb|Mar|Apr|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+\d{4}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
const PARTY_RE = /\b(?:PT|CV|UD|Koperasi|Yayasan|Universitas|Dinas)\s+[A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]+){0,3}/g;
const PLACE_RE =
  /(?:di|ke|dari)\s+((?:Pelabuhan|Kota|Kabupaten|Kecamatan|Desa|Bandara|Pelabuhan)\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/;
const TYPE_KEYWORDS = [
  [/kontrak|contract|perjanjian/i, 'Contract'],
  [/inspeksi|inspection/i, 'Inspection Report'],
  [/laporan|report/i, 'Report'],
  [/invoice|faktur|tagihan/i, 'Invoice'],
  [/surat|letter/i, 'Letter'],
  [/sertifikat|certificate/i, 'Certificate'],
  [/proposal/i, 'Proposal'],
  [/notulen|minutes|berita acara/i, 'Meeting Minutes'],
];

const STOPWORDS = new Set(
  'yang dan atau dengan untuk dari pada adalah ini itu dalam sebagai oleh karena saat telah akan juga tidak ada di ke pada sebuah para sangat lebih kurang serta namun agar supaya yaitu yakni antara setelah sebelum ketika dimana bagaimana tersebut mereka kami kita saya anda beliau bapak ibu adalah telah sudah akan sedang masih juga hanya pun kah lah yang the and for with from this that have has will would can could should there here when where which what about into over under after before between through during each other more most some such only own same than too very just'.split(
    ' '
  )
);

export function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export function extractiveSummary(text, title = '') {
  const sentences = splitSentences(text);
  const overview = sentences.slice(0, 2).join(' ').slice(0, 600) || text.slice(0, 600);

  const critical = sentences.filter((s) => CRITICAL_RE.test(s)).slice(0, 3);
  const critical_points =
    critical.length > 0 ? critical : sentences.slice(2, 5);

  const actions = sentences.filter((s) => ACTION_RE.test(s)).slice(0, 3);
  const action_items =
    actions.length > 0
      ? actions
      : sentences
          .slice(2)
          .filter((s) => !critical_points.includes(s))
          .slice(0, 2);

  const dates = [...text.matchAll(DATE_RE)].slice(0, 4).map((m) => {
    const idx = m.index ?? 0;
    const before = text.slice(Math.max(0, idx - 40), idx).toLowerCase();
    const label =
      /batas|tenggat|deadline/.test(before)
        ? 'Batas waktu'
        : /jadwal|tanggal|inspeksi|periksa/.test(before)
          ? 'Tanggal penting'
          : 'Tanggal disebut';
    return { label, value: m[0] };
  });

  let document_type = 'Dokumen';
  for (const [re, label] of TYPE_KEYWORDS) {
    if (re.test(text) || re.test(title)) {
      document_type = label;
      break;
    }
  }

  const parties = [...new Set([...text.matchAll(PARTY_RE)].map((m) => m[0].trim()))].slice(0, 5);
  const place = text.match(PLACE_RE);
  const freq = new Map();
  for (const w of text.toLowerCase().replace(/[^a-z0-9áéíóúàèìòùâêîôûäëïöü\s]/gi, ' ').split(/\s+/)) {
    if (w.length >= 5 && !STOPWORDS.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const tags = [...freq.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  return {
    mode: 'card',
    overview,
    critical_points,
    action_items,
    key_dates: dates,
    metadata: {
      document_type,
      parties,
      location: place ? place[1] : '',
      tags,
    },
  };
}

// ---------------------------------------------------------------------------
// Validasi input (pure — unit-tested)
// ---------------------------------------------------------------------------
export function validateSummarizeBody(body) {
  if (!body || typeof body !== 'object') return 'Body harus JSON.';
  const hasText = typeof body.text === 'string' && body.text.trim().length > 0;
  const hasImage = typeof body.imageBase64 === 'string' && body.imageBase64.length > 0;
  if (!hasText && !hasImage) return 'Kirim `text` atau `imageBase64`.';
  if (hasText && body.text.length > MAX_TEXT_CHARS)
    return `Teks terlalu panjang (maksimal ${MAX_TEXT_CHARS} karakter).`;
  if (hasImage) {
    const m = /^data:image\/(png|jpe?g|webp|tiff?);base64,/.exec(body.imageBase64);
    if (!m) return 'imageBase64 harus data URL gambar (png/jpg/webp/tiff).';
    if (body.imageBase64.length > MAX_IMAGE_BYTES * 1.4)
      return 'Gambar terlalu besar (maksimal ~8 MB).';
  }
  if (body.title !== undefined && typeof body.title !== 'string')
    return '`title` harus string.';
  if (body.template !== undefined) {
    if (typeof body.template !== 'object' || body.template === null)
      return '`template` harus objek.';
    if (!Array.isArray(body.template.fields) || body.template.fields.length === 0)
      return '`template.fields` harus array field yang tidak kosong.';
    for (const f of body.template.fields) {
      if (!f || typeof f.key !== 'string' || typeof f.label !== 'string')
        return 'Setiap field template butuh `key` dan `label` string.';
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ringkasan mode tabel (template kustom) — AI dan ekstraktif.
// ---------------------------------------------------------------------------
function extractiveTable(text, template) {
  const sentences = splitSentences(text);
  const rows = template.fields.map((f) => {
    const keywords = `${f.label} ${f.description || ''}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    let best = '';
    let bestScore = 0;
    for (const s of sentences) {
      const low = s.toLowerCase();
      let score = 0;
      for (const k of keywords) if (low.includes(k)) score += 1;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    return {
      key: f.key,
      label: f.label,
      value: bestScore > 0 ? best : 'Tidak ditemukan di dokumen',
    };
  });
  return { mode: 'table', template_id: template.id || '', rows };
}

async function aiTableSummarize(env, text, template) {
  const fieldDescriptions = template.fields
    .map((f) => `- ${f.label} (${f.key}): ${f.description || ''}${f.required ? ' [REQUIRED]' : ''}`)
    .join('\n');
  const prompt =
    `Extract the following information from this document and return as JSON:\n\n${fieldDescriptions}\n\nDocument text:\n${text}\n\nReturn JSON in this format:\n{\n  "mode": "table",\n  "template_id": "${template.id || ''}",\n  "rows": [\n    { "key": "field_key", "label": "Field Label", "value": "extracted value" }\n  ]\n}`;
  const raw = await callOpenRouter(env, 'google/gemini-flash-1.5', [{ role: 'user', content: prompt }], 0.2, 2000);
  const parsed = cleanJson(raw);
  if (!parsed.rows || !Array.isArray(parsed.rows)) throw new Error('Invalid table summary structure');
  return parsed;
}

// ---------------------------------------------------------------------------
// OpenRouter (jalur AI) — prompt sama dengan lib/openrouter/summarize.ts
// ---------------------------------------------------------------------------
async function callOpenRouter(env, model, messages, temperature, maxTokens) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY_MISSING');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.NEXT_PUBLIC_APP_URL || 'https://docsumm.pages.dev',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from OpenRouter');
  return content;
}

function cleanJson(raw) {
  let s = String(raw).trim();
  if (s.startsWith('```')) s = s.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  return JSON.parse(s);
}

const SUMMARY_PROMPT = (text) => `You are a professional document analyst.
Analyze the following document and return a structured JSON summary.
Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "mode": "card",
  "overview": "2-3 sentence summary of the document",
  "critical_points": ["critical point 1", "critical point 2", "critical point 3"],
  "action_items": ["action item 1", "action item 2"],
  "key_dates": [{"label": "date label", "value": "date value"}],
  "metadata": {
    "document_type": "type of document (e.g., contract, report, invoice)",
    "parties": ["party 1", "party 2"],
    "location": "location if mentioned or empty string",
    "tags": ["tag1", "tag2", "tag3"]
  }
}
Important:
- Be concise and factual
- Extract actual dates, parties, and locations from the document
- If information is not present, use empty string or empty array
- Return ONLY valid JSON, no markdown code blocks

Document text:
${text}

JSON output:`;

async function aiSummarize(env, text) {
  const first = await callOpenRouter(env, 'google/gemini-flash-1.5', [{ role: 'user', content: SUMMARY_PROMPT(text) }], 0.2, 2000);
  try {
    const parsed = cleanJson(first);
    if (!parsed.mode || !parsed.overview) throw new Error('Invalid summary structure');
    return parsed;
  } catch {
    const retry = await callOpenRouter(
      env,
      'google/gemini-flash-1.5',
      [{ role: 'user', content: `${SUMMARY_PROMPT(text)}\n\nIMPORTANT: Return ONLY the JSON object, no other text, no markdown formatting.` }],
      0.1,
      2000
    );
    return cleanJson(retry);
  }
}

async function aiOcr(env, imageBase64) {
  return callOpenRouter(
    env,
    'google/gemini-2.0-flash-exp',
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all text from this document image. Return only the raw text content, no formatting, no explanations.' },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
    0.1,
    4000
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function supabaseUrl(env) {
  return env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
}

function projectRef(env) {
  const m = /^https:\/\/([a-z0-9-]+)\.supabase\.co/i.exec(supabaseUrl(env));
  return m ? m[1] : '';
}

function hasSessionCookie(request, env) {
  const ref = projectRef(env);
  if (!ref) return false;
  const cookies = request.headers.get('cookie') || '';
  // @supabase/ssr menyimpan sesi di cookie `sb-<ref>-auth-token`
  // (bisa ter-chunk jadi .0/.1 — cukup cek prefix).
  return cookies.split(';').some((c) => c.trim().startsWith(`sb-${ref}-auth-token`));
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

// ---------------------------------------------------------------------------
// POST /api/summarize
// ---------------------------------------------------------------------------
async function handleSummarize(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body harus JSON.' }, 400);
  }
  const err = validateSummarizeBody(body);
  if (err) return json({ error: err }, 400);

  const hasKey = Boolean(env.OPENROUTER_API_KEY);

  try {
    if (body.imageBase64) {
      if (!hasKey) {
        return json(
          {
            error:
              'OCR gambar butuh kunci AI. Pasang secret OPENROUTER_API_KEY di Pages, atau unggah dokumen sebagai PDF (teks PDF dibaca langsung di browser, tanpa kunci).',
            code: 'OCR_KEY_REQUIRED',
          },
          400
        );
      }
      const text = (await aiOcr(env, body.imageBase64)).trim();
      if (!text) return json({ error: 'Tidak ada teks yang terbaca dari gambar ini.' }, 422);
      if (body.template) {
        const summary = await aiTableSummarize(env, text, body.template);
        return json({ summary, engine: 'ai', source: 'ocr' });
      }
      const summary = await aiSummarize(env, text);
      return json({ summary, engine: 'ai', source: 'ocr' });
    }

    const text = body.text.trim();
    if (body.template) {
      // Mode template kustom → output tabel (lib/utils/buildPrompt.ts).
      if (hasKey) {
        try {
          const summary = await aiTableSummarize(env, text, body.template);
          return json({ summary, engine: 'ai', source: 'text' });
        } catch (e) {
          console.error('AI table summarize failed, falling back to extractive:', e);
          return json({
            summary: extractiveTable(text, body.template),
            engine: 'extractive',
            source: 'text',
            ai_error: String((e && e.message) || e),
          });
        }
      }
      return json({ summary: extractiveTable(text, body.template), engine: 'extractive', source: 'text' });
    }
    if (hasKey) {
      try {
        const summary = await aiSummarize(env, text);
        return json({ summary, engine: 'ai', source: 'text' });
      } catch (e) {
        // AI gagal (kuota/model mati) — jangan gagalkan upload; fallback
        // ekstraktif tetap memberi ringkasan yang bisa dipakai.
        console.error('AI summarize failed, falling back to extractive:', e);
        return json({
          summary: extractiveSummary(text, body.title || ''),
          engine: 'extractive',
          source: 'text',
          ai_error: String((e && e.message) || e),
        });
      }
    }
    return json({ summary: extractiveSummary(text, body.title || ''), engine: 'extractive', source: 'text' });
  } catch (e) {
    console.error('summarize error:', e);
    return json({ error: 'Gagal membuat ringkasan. Coba lagi.' }, 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/status — dipakai halaman Settings + smoke test CI.
// ---------------------------------------------------------------------------
function handleStatus(env) {
  return json({
    ok: true,
    service: 'docsumm',
    mode: supabaseUrl(env) ? 'supabase' : 'demo',
    ai: Boolean(env.OPENROUTER_API_KEY),
    engine: env.OPENROUTER_API_KEY ? 'ai' : 'extractive',
    supabase_configured: Boolean(supabaseUrl(env)),
  });
}

// ---------------------------------------------------------------------------
// GET /auth/callback — tukar PKCE code jadi sesi (pengganti
// app/auth/callback/route.ts yang tidak bisa ikut static export).
// ---------------------------------------------------------------------------
async function handleAuthCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/app/dashboard';
  const loginUrl = new URL('/auth/login', url.origin);
  loginUrl.searchParams.set('error', 'callback_error');
  if (!code || !supabaseUrl(env)) return Response.redirect(loginUrl.toString(), 302);

  const res = await fetch(
    `${supabaseUrl(env)}/auth/v1/token?grant_type=pkce&code=${encodeURIComponent(code)}`,
    {
      method: 'POST',
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  );
  if (!res.ok) return Response.redirect(loginUrl.toString(), 302);
  const session = await res.json();
  const ref = projectRef(env);
  const cookieValue = b64urlEncode(JSON.stringify(session));
  const headers = new Headers({ Location: new URL(next, url.origin).toString() });
  // Format cookie sama seperti @supabase/ssr (base64url JSON sesi).
  headers.append(
    'Set-Cookie',
    `sb-${ref}-auth-token=${cookieValue}; Path=/; Max-Age=31536000; SameSite=Lax`
  );
  return new Response(null, { status: 302, headers });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const handler = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/status' && request.method === 'GET') return handleStatus(env);
    if (url.pathname === '/api/summarize') {
      if (request.method !== 'POST') return json({ error: 'Method harus POST.' }, 405);
      return handleSummarize(request, env);
    }
    if (url.pathname === '/auth/callback' && request.method === 'GET') {
      return handleAuthCallback(request, env);
    }

    // Guard auth (pengganti middleware.ts yang tidak bisa ikut export):
    // mode Supabase + tanpa cookie sesi → /auth/login; sebaliknya lolos.
    // Mode demo: semua rute /app/* terbuka.
    const configured = Boolean(supabaseUrl(env));
    if (configured && url.pathname.startsWith('/app/') && !hasSessionCookie(request, env)) {
      return Response.redirect(new URL('/auth/login', url.origin).toString(), 302);
    }
    if (configured && url.pathname.startsWith('/auth/') && hasSessionCookie(request, env)) {
      return Response.redirect(new URL('/app/dashboard', url.origin).toString(), 302);
    }

    if (env.ASSETS) {
      let asset = await env.ASSETS.fetch(request);
      // Static export menyimpan halaman sebagai <rute>.html, sementara
      // URL yang diminta adalah <rute> (tanpa ekstensi). Jangan bergantung
      // pada pemetaan default Pages — coba <rute>.html secara eksplisit.
      if (asset.status === 404 && !url.pathname.split('/').pop().includes('.')) {
        const html = await env.ASSETS.fetch(
          new Request(new URL(`${url.pathname.replace(/\/$/, '')}.html`, request.url))
        );
        if (html.status !== 404) asset = html;
      }
      if (asset.status !== 404) return asset;
      // Static export hanya punya SATU halaman hasil prerender (dokumen
      // contoh, lihat app/app/result/[id]/page.tsx). Id lain tidak punya
      // file — sajikan shell itu; komponen klien memuat dokumen yang
      // benar dari id di URL. Tanpa ini, refresh / deep link ke hasil
      // dokumen baru akan 404.
      if (/^\/app\/result\/[^/]+\/?$/.test(url.pathname)) {
        return env.ASSETS.fetch(
          new Request(
            new URL('/app/result/00000000-0000-4000-8000-000000000001.html', request.url)
          )
        );
      }
      return asset;
    }
    return new Response('Not found', { status: 404 });
  },
};

export default handler;

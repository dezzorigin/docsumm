// Unit test worker DocSumm — `npm test` (node --test).
// Menguji kontrak yang dijanjikan ke frontend: bentuk SummaryCardOutput
// ekstraktif, validasi /api/summarize, /api/status, dan fallback ASSETS.
import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { extractiveSummary, validateSummarizeBody } from './_worker.js';

const SAMPLE_TEXT = [
  'Laporan inspeksi lambung kapal MV Nusantara di Pelabuhan Belawan, 14 Juni 2024.',
  'Ditemukan korosi level 3 pada frame 42-48 yang wajib segera diperbaiki karena risiko kebocoran.',
  'Ketebalan pelat berkurang 2,4 mm dari batas aman yang ditetapkan.',
  'Disarankan sandblasting dan coating ulang dalam 30 hari, batas perbaikan 14 Juli 2024.',
  'Jadwalkan inspeksi susulan sebelum pelayaran jarak jauh berikutnya.',
  'Pemeriksaan dilakukan oleh PT Maju Teknik bersama Ir. Santoso.',
].join(' ');

const ENV_DEMO = {};
const ENV_AI = { OPENROUTER_API_KEY: 'sk-test-tidak-asli' };

function req(path, init = {}) {
  return new Request(`https://docsumm.pages.dev${path}`, init);
}

test('extractiveSummary: bentuk SummaryCardOutput lengkap', () => {
  const s = extractiveSummary(SAMPLE_TEXT, 'Laporan Inspeksi Kapal.pdf');
  assert.equal(s.mode, 'card');
  assert.ok(s.overview.length > 40, 'overview harus 2 kalimat pembuka');
  assert.ok(s.critical_points.length >= 1, 'harus ada poin kritis');
  assert.ok(s.critical_points.some((p) => /korosi/i.test(p)), 'kalimat korosi harus masuk poin kritis');
  assert.ok(s.action_items.length >= 1, 'harus ada action item');
  assert.ok(s.key_dates.length >= 1, 'tanggal harus terekstrak');
  assert.equal(s.metadata.document_type, 'Inspection Report');
  assert.ok(s.metadata.parties.includes('PT Maju Teknik'), 'pihak PT harus terekstrak');
  assert.equal(s.metadata.location, 'Pelabuhan Belawan');
  assert.ok(s.metadata.tags.length >= 1, 'harus ada tag');
});

test('extractiveSummary: teks pendek tidak crash', () => {
  const s = extractiveSummary('Halo dunia. Ini dokumen singkat.', 'catatan.txt');
  assert.equal(s.mode, 'card');
  assert.ok(s.overview.length > 0);
});

test('validateSummarizeBody: menolak body kosong / teks raksasa / gambar bukan data URL', () => {
  assert.ok(validateSummarizeBody(null));
  assert.ok(validateSummarizeBody({}));
  assert.ok(validateSummarizeBody({ text: 'x'.repeat(120_001) }));
  assert.ok(validateSummarizeBody({ imageBase64: 'https://example.com/a.png' }));
  assert.equal(validateSummarizeBody({ text: 'teks ok' }), null);
  assert.equal(validateSummarizeBody({ imageBase64: 'data:image/png;base64,aaaa' }), null);
});

test('GET /api/status: mode demo tanpa env', async () => {
  const res = await handler.fetch(req('/api/status'), ENV_DEMO);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'demo');
  assert.equal(data.engine, 'extractive');
  assert.equal(data.ai, false);
});

test('GET /api/status: mode supabase + ai bila env ada', async () => {
  const res = await handler.fetch(req('/api/status'), {
    ...ENV_AI,
    NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefg.supabase.co',
  });
  const data = await res.json();
  assert.equal(data.mode, 'supabase');
  assert.equal(data.engine, 'ai');
});

test('POST /api/summarize (teks, tanpa kunci): 200 engine extractive', async () => {
  const res = await handler.fetch(
    req('/api/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: SAMPLE_TEXT, title: 'Laporan Inspeksi Kapal.pdf' }),
    }),
    ENV_DEMO
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.engine, 'extractive');
  assert.equal(data.summary.mode, 'card');
  assert.ok(data.summary.overview.includes('MV Nusantara'));
});

test('POST /api/summarize: body kosong → 400', async () => {
  const res = await handler.fetch(
    req('/api/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }),
    ENV_DEMO
  );
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.ok(data.error);
});

test('POST /api/summarize (gambar, tanpa kunci): 400 OCR_KEY_REQUIRED', async () => {
  const res = await handler.fetch(
    req('/api/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,aaaa', title: 'scan.png' }),
    }),
    ENV_DEMO
  );
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.code, 'OCR_KEY_REQUIRED');
});

test('POST /api/summarize (template, tanpa kunci): 200 mode table', async () => {
  const res = await handler.fetch(
    req('/api/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: SAMPLE_TEXT,
        title: 'Laporan Inspeksi Kapal.pdf',
        template: {
          id: 'tpl-1',
          fields: [
            { key: 'document_type', label: 'Jenis Dokumen', description: 'Tipe dokumen', required: true },
            { key: 'critical_points', label: 'Poin Kritis', description: 'korosi dan kerusakan', required: true },
          ],
        },
      }),
    }),
    ENV_DEMO
  );
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.engine, 'extractive');
  assert.equal(data.summary.mode, 'table');
  assert.equal(data.summary.rows.length, 2);
  assert.ok(data.summary.rows[1].value.includes('korosi'), 'field poin kritis harus terisi dari teks');
});

test('POST /api/summarize: template tanpa fields → 400', async () => {
  const res = await handler.fetch(
    req('/api/summarize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: SAMPLE_TEXT, template: { id: 'x', fields: [] } }),
    }),
    ENV_DEMO
  );
  assert.equal(res.status, 400);
});

test('GET /api/summarize: 405', async () => {
  const res = await handler.fetch(req('/api/summarize'), ENV_DEMO);
  assert.equal(res.status, 405);
});

test('mode demo: /app/* terbuka tanpa cookie (guard hanya aktif bila Supabase terpasang)', async () => {
  const env = {
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) },
  };
  const res = await handler.fetch(req('/app/dashboard'), env);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'asset');
});

test('mode Supabase: /app/* tanpa cookie sesi → redirect /auth/login', async () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefg.supabase.co',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) },
  };
  const res = await handler.fetch(req('/app/dashboard'), env);
  assert.equal(res.status, 302);
  assert.ok(res.headers.get('location').endsWith('/auth/login'));
});

test('halaman hasil id lain: fallback ke shell dokumen contoh (bukan 404)', async () => {
  const env = {
    ASSETS: {
      fetch: async (r) => {
        const u = new URL(r.url);
        if (u.pathname === '/app/result/00000000-0000-4000-8000-000000000001.html') {
          return new Response('result-shell', { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      },
    },
  };
  const res = await handler.fetch(req('/app/result/abc-123'), env);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'result-shell');
});

test('rute tanpa ekstensi: worker mencoba <rute>.html', async () => {
  const env = {
    ASSETS: {
      fetch: async (r) => {
        const u = new URL(r.url);
        if (u.pathname === '/app/dashboard.html') {
          return new Response('dashboard-html', { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      },
    },
  };
  const res = await handler.fetch(req('/app/dashboard'), env);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'dashboard-html');
});

test('path tak dikenal: tetap 404', async () => {
  const env = {
    ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) },
  };
  const res = await handler.fetch(req('/tidak-ada'), env);
  assert.equal(res.status, 404);
});

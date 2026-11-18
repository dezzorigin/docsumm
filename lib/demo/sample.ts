// Data contoh mode demo — diambil dari docs/SCHEMA.md (contoh
// summary_json "Laporan Inspeksi Kapal"). Dipakai sebagai seed
// localStorage supaya dashboard + halaman hasil bisa langsung dilihat
// tanpa mengunggah dokumen.

import type { Document, Template } from '@/lib/types'

export const SAMPLE_DOCUMENT: Document = {
  id: '00000000-0000-4000-8000-000000000001',
  user_id: 'demo',
  title: 'Laporan Inspeksi Kapal — MV Nusantara.pdf',
  file_url: '',
  file_type: 'pdf',
  page_count: 4,
  status: 'done',
  raw_text:
    'Laporan inspeksi lambung MV Nusantara di Pelabuhan Belawan, 14 Juni 2024. ' +
    'Ditemukan korosi level 3 pada frame 42-48. Disarankan sandblasting dalam 30 hari.',
  summary_json: {
    mode: 'card',
    overview:
      'Laporan inspeksi lambung kapal MV Nusantara yang dilakukan di Pelabuhan Belawan pada 14 Juni 2024. Inspeksi menemukan korosi tingkat menengah pada area frame 42–48 yang memerlukan tindakan perbaikan dalam waktu dekat agar tidak mengganggu jadwal pelayaran.',
    critical_points: [
      'Korosi level 3 pada frame 42–48 — tingkat kerusakan menengah',
      'Area lambung kiri paling terdampak; ketebalan pelat berkurang',
      'Kapal masih laik layar untuk satu pelayaran berikutnya dengan batasan muatan',
    ],
    action_items: [
      'Sandblasting dan coating ulang frame 42–48 dalam 30 hari',
      'Ukur ulang ketebalan pelat setelah sandblasting',
      'Jadwalkan inspeksi susulan sebelum pelayaran jarak jauh berikutnya',
    ],
    key_dates: [
      { label: 'Tanggal inspeksi', value: '14 Juni 2024' },
      { label: 'Batas perbaikan', value: '14 Juli 2024' },
    ],
    metadata: {
      document_type: 'Inspection Report',
      parties: ['PT Maju Teknik', 'Ir. Santoso'],
      location: 'Pelabuhan Belawan',
      tags: ['hull', 'maintenance', 'corrosion'],
    },
  },
  output_mode: 'card',
  created_at: '2026-11-18T09:00:00.000Z',
  updated_at: '2026-11-18T09:00:00.000Z',
}

export const SAMPLE_TEMPLATE: Template = {
  id: '00000000-0000-4000-8000-000000000002',
  user_id: 'demo',
  name: 'Laporan Inspeksi Kapal',
  description: 'Template ekstraksi untuk laporan inspeksi kapal: jenis dokumen, poin kritis, dan tindakan.',
  fields: [
    {
      key: 'document_type',
      label: 'Jenis Dokumen',
      description: 'Tipe atau kategori dokumen',
      required: true,
    },
    {
      key: 'critical_points',
      label: 'Poin Kritis',
      description: 'Hal-hal yang memerlukan tindakan segera',
      required: true,
    },
    {
      key: 'action_items',
      label: 'Tindakan yang Diperlukan',
      description: 'Daftar aksi yang harus dilakukan',
      required: false,
    },
  ],
  output_mode: 'table',
  is_default: true,
  created_at: '2026-11-18T09:00:00.000Z',
}

# DocSumm — Database Schema

> SQL siap eksekusi ada di [`supabase/schema.sql`](../supabase/schema.sql)
> (tabel + RLS + trigger profil + policy Storage) — dokumen ini adalah
> penjelasan manusiawinya. Keduanya harus dijaga tetap sejalan.

## Tables

### users (managed by Supabase Auth)
Extended via profiles table.

---

### profiles
| column       | type      | notes                        |
|--------------|-----------|------------------------------|
| id           | uuid (PK) | references auth.users        |
| full_name    | text      |                              |
| email        | text      |                              |
| avatar_url   | text      | nullable                     |
| plan         | text      | 'free' or 'pro'              |
| created_at   | timestamp | default now()                |

RLS: user can only read/update own row.

---

### documents
| column        | type      | notes                              |
|---------------|-----------|------------------------------------|
| id            | uuid (PK) | default gen_random_uuid()          |
| user_id       | uuid (FK) | references profiles.id             |
| title         | text      | filename or user-defined           |
| file_url      | text      | Supabase Storage URL               |
| file_type     | text      | 'pdf' or 'image'                   |
| page_count    | int       | nullable                           |
| status        | text      | 'processing' / 'done' / 'error'    |
| raw_text      | text      | OCR output (nullable)              |
| summary_json  | jsonb     | structured summary output          |
| template_id   | uuid (FK) | references templates.id (nullable) |
| output_mode   | text      | 'card' or 'table'                  |
| created_at    | timestamp | default now()                      |
| updated_at    | timestamp | auto-updated                       |

RLS: user can only CRUD own rows.

---

### templates
| column       | type      | notes                            |
|--------------|-----------|----------------------------------|
| id           | uuid (PK) | default gen_random_uuid()        |
| user_id      | uuid (FK) | references profiles.id           |
| name         | text      | e.g. "Laporan Inspeksi Kapal"    |
| description  | text      | nullable                         |
| fields       | jsonb     | array of field definitions       |
| output_mode  | text      | 'card' or 'table'                |
| is_default   | boolean   | default false                    |
| created_at   | timestamp | default now()                    |

RLS: user can only CRUD own rows.

#### fields JSONB structure:
```json
[
  {
    "key": "document_type",
    "label": "Jenis Dokumen",
    "description": "Tipe atau kategori dokumen",
    "required": true
  },
  {
    "key": "critical_points",
    "label": "Poin Kritis",
    "description": "Hal-hal yang memerlukan tindakan segera",
    "required": true
  },
  {
    "key": "action_items",
    "label": "Tindakan yang Diperlukan",
    "description": "Daftar aksi yang harus dilakukan",
    "required": false
  }
]
```

---

### contact_requests
| column       | type      | notes                             |
|--------------|-----------|-----------------------------------|
| id           | uuid (PK) |                                   |
| name         | text      |                                   |
| email        | text      |                                   |
| company      | text      | nullable                          |
| message      | text      |                                   |
| source       | text      | 'custom_model_cta' or 'general'   |
| created_at   | timestamp | default now()                     |

RLS: insert only (no read from client).

---

## Storage Buckets

### documents (private)
- Path: `{user_id}/{document_id}/{filename}`
- Access: authenticated users only, own files only
- Max size: 50MB
- Allowed types: pdf, jpg, jpeg, png, tiff, webp

---

## summary_json Structure

### Default mode (card output):
```json
{
  "mode": "card",
  "overview": "Ringkasan umum dokumen...",
  "critical_points": [
    "Poin kritis pertama",
    "Poin kritis kedua"
  ],
  "action_items": [
    "Tindakan 1",
    "Tindakan 2"
  ],
  "key_dates": [
    { "label": "Tanggal inspeksi", "value": "14 Juni 2024" }
  ],
  "metadata": {
    "document_type": "Inspection Report",
    "parties": ["PT Maju Teknik", "Ir. Santoso"],
    "location": "Pelabuhan Belawan",
    "tags": ["hull", "maintenance", "corrosion"]
  }
}
```

### Custom template mode (table output):
```json
{
  "mode": "table",
  "template_id": "uuid",
  "rows": [
    { "key": "document_type", "label": "Jenis Dokumen", "value": "Laporan Inspeksi" },
    { "key": "critical_points", "label": "Poin Kritis", "value": "Korosi level 3 pada frame 42-48" },
    { "key": "action_items", "label": "Tindakan", "value": "Sandblasting dalam 30 hari" }
  ]
}
```

---

## Indexes
```sql
create index on documents(user_id);
create index on documents(status);
create index on documents(created_at desc);
create index on templates(user_id);
```

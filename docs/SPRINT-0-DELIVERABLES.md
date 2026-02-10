# SPRINT 0 DELIVERABLES (APPLIED)

> Bu dokuman karar kaydidir ve `docs/PROJE-TALIMATLARI.md` ile uyumlu olmak zorundadir.

## 1. Decision Log (Sprint 0)
| ID | Decision | Rationale | Impact |
| --- | --- | --- | --- |
| D-01 | Deploy modeli: Docker tabanli Express API + Worker servisleri | Conversion isleri uzun suruyor, binary bagimliliklar var, serverless limitleri riskli | API ve worker ayrilacak, scale edilebilir |
| D-02 | Queue: Redis + BullMQ (worker) | Islerin izlenmesi, retry ve backoff ihtiyaci | Redis bagimliligi eklenir |
| D-03 | Auth: Supabase JWT, Authorization: Bearer | Tek auth kaynagi ve mevcut altyapi | API token dogrulama gerekir |
| D-04 | Storage: Supabase buckets ve standard path | Outputlar paylasilabilir, lifecycle net | Path standardi zorunlu |
| D-05 | Rendering + PDF: React + Carbon Components + Paged.js | Tek kaynak gorunum + matbaa kalitesi | Print CSS ve Paged.js entegrasyonu gerekir |
| D-06 | AI provider: Gemini 3 Pro (preview) + 2.5 Pro fallback | Uzamsal muhakeme ve layout kararlari | API key server tarafinda tutulur |
| D-07 | API Base URL: VITE_API_URL ile tek hedef | Netlify functions bagimliligi kaldirilir | FE servis refaktor gerekir |
| D-08 | Template naming: carbon-<variant> | Engine paritesi ve template secimi | UI/BE/Converter hizasi gerekir |
| D-09 | Error format: unified error payload | Operasyon ve FE hata yonetimi | Backend standardi gerekir |
| D-10 | Logging: request_id + job_id | Debug ve izlenebilirlik | Middleware gerekir |
| D-11 | Print token pack + pattern library | PDF tasarim standardini sabitler | Template registry ile baglanti kurulur |
| D-12 | PDF kalite zinciri: statik lint + Gemini QA | Self-healing icin determinism | QA pipeline gerektirir |
| D-13 | CarbonPress uyumu: Press Pack + editorial states + preflight gate | Template/icerik versiyonlamasi ve release kontrolu | Release manifest ve publish akisi gerekir |

## 2. API Contract (Draft)
Base URL:
- Dev: http://localhost:3001
- Prod: $API_BASE_URL

Headers:
- Authorization: Bearer <supabase_jwt>
- Content-Type: application/json
- X-Request-Id: <uuid> (opsiyonel)

### POST /api/convert/to-markdown
Request:
```json
{
  "fileUrl": "https://...",
  "fileType": "pdf|docx|md|txt",
  "documentId": "uuid"
}
```
Response:
```json
{
  "jobId": "uuid",
  "status": "queued"
}
```

### POST /api/convert/to-pdf
Request:
```json
{
  "documentId": "uuid",
  "markdown": "...",
  "assets": [
    { "url": "https://cdn.example.com/logo.png" },
    { "storagePath": "user/123/doc/456/asset/logo.png" }
  ],
  "metadata": {
    "title": "Quarterly Report",
    "author": "Cureonics",
    "date": "2025-02-10",
    "locale": "tr-TR"
  },
  "template": "carbon-advanced",
  "pressPackId": "uuid",
  "layoutProfile": "symmetric",
  "printProfile": "pagedjs-a4",
  "settings": {
    "theme": "white|g10|g90|g100",
    "layoutProfile": "symmetric|asymmetric|dashboard",
    "printProfile": "pagedjs-a4|pagedjs-a3",
    "title": "Quarterly Report",
    "author": "Cureonics",
    "date": "2025-02-10"
  }
}
```
Response:
```json
{
  "jobId": "uuid",
  "status": "queued",
  "statusUrl": "/api/jobs/uuid",
  "downloadUrl": "/api/jobs/uuid/download",
  "pdfUrl": "/api/jobs/uuid/download"
}
```

### POST /api/jobs
Request:
```json
{
  "type": "convert-md|convert-pdf|ai-analyze",
  "payload": {}
}
```
Response:
```json
{ "jobId": "uuid", "status": "queued" }
```

### GET /api/jobs
Query:
```
?status=queued|processing|completed|failed|cancelled&limit=20&offset=0
```
Response:
```json
{
  "jobs": [
    {
      "id": "uuid",
      "type": "convert-pdf",
      "status": "processing",
      "payload": { "documentId": "uuid" },
      "result": {},
      "error_message": null,
      "created_at": "2025-02-10T09:00:00Z",
      "updated_at": "2025-02-10T09:01:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET /api/jobs/{id}
Response:
```json
{
  "jobId": "uuid",
  "status": "queued|processing|completed|failed|cancelled",
  "result": { "pdfUrl": "https://..." },
  "error": null,
  "events": [
    {
      "id": "uuid",
      "job_id": "uuid",
      "status": "processing",
      "message": "render-html",
      "created_at": "2025-02-10T09:01:10Z"
    }
  ],
  "downloadUrl": "/api/jobs/uuid/download"
}
```

### GET /api/jobs/{id}/download
Response:
- 302 redirect to signed URL when ready.
- 409 if the job is not completed.

### POST /api/ai/analyze
Request:
```json
{
  "markdown": "# Report\\n\\nBody content...",
  "metadata": {
    "title": "Quarterly Report",
    "theme": "white"
  }
}
```
Response:
```json
{
  "promptVersion": "v1",
  "model": "gemini-3-pro",
  "output": "{\\n  \\\"summary\\\": \\\"...\\\"\\n}"
}
```

### POST /api/ai/ask
Request:
```json
{
  "question": "Summarize the key risks.",
  "context": "Section 2 shows declining margins..."
}
```
Response:
```json
{
  "promptVersion": "v1",
  "model": "gemini-3-pro",
  "output": "Top risks: ..."
}
```

### POST /api/ai/markdown-to-carbon-html
Request:
```json
{
  "markdown": "# Title\n\nBody...",
  "metadata": {
    "theme": "white",
    "layoutProfile": "symmetric"
  }
}
```
Response:
```json
{
  "promptVersion": "v1",
  "model": "tunedModels/...",
  "output": "<h1 class=\"bx--type-expressive-heading-04\">Title</h1>..."
}
```

### Error Format (All endpoints)
```json
{
  "error": {
    "code": "INVALID_INPUT|UNAUTHORIZED|CONVERSION_FAILED",
    "message": "Human readable message",
    "details": "Optional details",
    "request_id": "uuid"
  }
}
```

## 3. Job State Model
States:
- queued
- processing
- completed
- failed
- cancelled

Transitions:
- queued -> processing
- processing -> completed
- processing -> failed
- queued|processing -> cancelled

Retry policy (default):
- max_attempts: 3
- backoff: exponential (1s, 5s, 20s)

## 4. DB Schema Draft (Jobs)
```sql
-- jobs table
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('convert-md','convert-pdf','ai-analyze')),
  status text not null check (status in ('queued','processing','completed','failed','cancelled')),
  payload jsonb default '{}'::jsonb,
  result jsonb default '{}'::jsonb,
  error_message text,
  attempts integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- job_events table
create table if not exists public.job_events (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null,
  message text,
  created_at timestamptz default now()
);

create index if not exists idx_jobs_user_id on public.jobs(user_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_job_events_job_id on public.job_events(job_id);
```

## 5. FE Service Migration Plan (Summary)
- Replace Netlify function calls with VITE_API_URL.
- documentService to call /api/convert/* endpoints.
- Poll /api/jobs/{id} until completed.
- Use signed URL from API for PDF preview/download.

## 6. Template Strategy (Summary)
- Template IDs: carbon-advanced, carbon-template, carbon-grid, carbon-colors, carbon-components, carbon-dataviz, carbon-theme-g100.
- Renderer picks template module + print CSS: React component + Paged.js style seti
- UI shows template list from static config (Sprint 1: registry)
- Pattern library: ExecutiveSummary, SurveyChartPage, WhatToDo gibi moduller
- Press Pack: template + tokens + patterns + QA rules + sample content

## 7. Token Mapping Draft (Summary)
Common tokens:
- typography: heading-01..07, body-01..02, code-01..02
- color: primary, secondary, background, text, success, warning, error
- spacing: 2, 4, 8, 12, 16, 24, 32, 48
Mapping:
- react/carbon: map to component props + design tokens
- paged.js: map to print CSS variables + @page kurallari
- print pack: baseline, safe-area, caption/footnote, chart spacing
- content schema: docType, templateKey, layoutProfile, printProfile, theme, locale, version

## 8. AI Service Plan (Summary)
- Endpoint: POST /api/ai/analyze, POST /api/ai/ask
- Server-side call: Gemini 3 Pro (preview) + 2.5 Pro fallback
- Rate limit per user (e.g. 60 req/hour)
- Logs: request_id, user_id, latency
- Prompt content limit: 20k chars

## 9. Deploy and Runtime
- Docker images: api, worker
- Redis for queue
- Supabase for auth/db/storage
- Runtime deps: paged.js, headless chromium, marker (preinstalled in image)

## 10. QA Checklist (Minimum)
- Upload -> convert-md -> convert-pdf flow
- Invalid file type
- Job failure and retry
- Template selection applied
- Paged.js preview + PDF download calisir
- PDF lint (overflow, widows/orphans, min font)
- PDF accessibility preflight (heading/order/link/contrast)
- Preflight gate: lint + AI QA fail ise publish yok

## 11. Sprint 0 Summary
Sprint 0 deliverables tamamlandi:
- Mimari kararlar verildi (Decision log)
- API contract taslagi hazir
- Job state ve DB schema taslagi hazir
- FE migration plani net
- Template ve token mapping yaklasimi belirlendi
- AI servis plan ve guvenlik notlari kayda girdi

## 12. Mevcut Durum Profili (Snapshot)
- Faz 0 tamam: karar ve planlar SoT ile hizali.
- Faz 1 tamam: job pipeline + Paged.js + Gemini art director + signed URL akisi dogrulandi.
- Faz 2 tamam: Sprint 3 preview/QA + autosave + frontmatter wizard tamam; Sprint 4 tamam.
- Faz 3 tamam: Sprint 5 template registry + preview + gallery tamam; Sprint 6 press pack + release/publish + preflight + governance UI tamam.

## 13. Sonraki Adimlar (Odak)
- Opsiyonel: alert esiklerini ortam KPI'larina gore kalibre et.

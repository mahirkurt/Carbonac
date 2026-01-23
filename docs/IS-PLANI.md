# IS PLANI - Carbonac (Detayli ve Ust Seviye Uygulama Plani)

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ile uyumlu olmak zorundadir. Cakisma halinde SoT gecerlidir.

## 1. Amac ve Kapsam
Carbonac, IBM Carbon Design System temelli, AI destekli markdown ve PDF uretimi yapan bir urundur.
Bu plan, en ileri duzey implementasyonu hedefleyen uctan uca is akisini ve teknik kapsamini tanimlar.

Kapsam dahil:
- API ve worker altyapisi (queue tabanli job yurutme)
- Conversion pipeline (doc -> md -> pdf)
- Template sistemi, token mapping ve tema paketleri
- Web UI (editor, preview, wizard, template secimi)
- AI servis katmani (server-side proxy, analyze/ask)
- Storage ve dosya yasam dongusu
- Observability, guvenlik, kalite ve dokumantasyon

Kapsam disi:
- Tam kurumsal SSO/SCIM (opsiyonel faz)
- On-prem enterprise kurulum (opsiyonel faz)
- Tam otomatik multi-region aktif/aktif

## 2. SoT Uyumlu Sistem Kararlari (Ozet)
- Deploy modeli: Docker tabanli Express API + Worker servisleri
- Queue: Redis + BullMQ
- Auth: Supabase JWT (Authorization: Bearer)
- Rendering motoru: React + Carbon Components
- Baski/PDF motoru: Paged.js (print CSS + sayfalandirma)
- Storage: Supabase buckets, standard path
- Preview: Paged.js render + PDF download
- AI provider: Gemini 3 Pro (preview) + 2.5 Pro fallback (server-side proxy)
- API base URL: `VITE_API_URL`
- Error format: unified error payload (code, message, details, request_id)
- Logging: request_id + job_id zorunlu
- Print token pack + pattern library: PDF tasarim standardi
- PDF kalite zinciri: statik lint + Gemini QA self-healing
- CarbonPress uyumu: Press Pack manifest + editorial akis + preflight gate

## 3. Hedef Mimari Bilesenler
1) Ingestion: upload, metadata, type detection, validation
2) Parser: AST parse, content classification
3) AI Orchestration: layout, component secimi, visualization tavsiyesi
4) Renderer: Carbon tokenlari ve template tabanli layout
5) PDF Engine: headless render + print optimizer
6) Storage/Delivery: signed URL, lifecycle, cache

## 4. Basari Metrikleri (KPI)
- Conversion basari orani: >= 98%
- p95 convert time: 10 sayfa < 30s, 50 sayfa < 120s
- p95 queue wait: < 10s (normal yuk)
- Preview load: 10 sayfa PDF < 2s
- API availability: >= 99.5%
- Error rate: < 1% (5xx)
- Docs coverage: SoT ve plan dokumanlari guncel
- Carbon Adherence Score: >= 85
- Layout Health Score: >= 90
- Readability Score: >= 80

## 5. Varsayimlar ve Bagimliliklar
- Paged.js ve headless Chromium runtime kullanilabilir ve lisans uyumludur
- Supabase (auth/db/storage) aktif ve erisilebilir
- Redis erisimi saglanir (uzak veya lokal)
- Docker tabanli runtime zorunludur
- AI cagrilari server-side proxy ile gerceklesir

## 6. Calisma Akislari (Workstreams)
1) API/Backend
2) Worker/Queue
3) Frontend UX
4) Template ve Tasarim Sistemi
5) AI Servis Katmani
6) Data/Supabase
7) Infra/DevOps
8) Security/Compliance
9) QA/Observability
10) Dokumantasyon ve Release

## 7. Faz Ozeti (Yuksek Seviye)
| Faz | Sprintler | Odak |
| --- | --- | --- |
| Faz 0 | Sprint 0 | Mimari kararlar, contract, risk, PoC |
| Faz 1 | Sprint 1-2 | Core pipeline, job modeli, storage akisi |
| Faz 2 | Sprint 3-4 | Editor/preview, kalite kontrolleri |
| Faz 3 | Sprint 5-6 | Template registry, token mapping, tema paketleri |
| Faz 4 | Sprint 7-8 | Urunlesme, operasyon, guvenlik, billing |

## 8. Fazlar ve Sprintler (Detay)

### Faz 0 - Temel Hizalama (Sprint 0)
Ama: Mimari kararlar, API contract, risk ve backlog netligi.
Ciktilar:
- Decision log, API contract, job state modeli
- Supabase schema taslagi
- FE servis refactor plan
- Deploy modeli ve runtime bagimliliklari
Kabul kriterleri:
- `docs/SPRINT-0-DELIVERABLES.md` tamam
- Mimari kararlar SoT ile uyumlu

### Faz 1 - Core Pipeline (Sprint 1-2)
Ama: Tek API + queue + worker ile conversion pipeline'in calismasi.
Sprint 1 Epics:
- jobs/job_events migration
- /api/jobs ve /api/convert/to-pdf akisi
- Redis + BullMQ worker iskeleti
- FE polling ve API base URL
Sprint 2 Epics:
- Paged.js baski motoru ve print CSS katmani
- Gemini 3 Pro art director (layout JSON + data storytelling)
- storage path standardi + signed URL
Kabul kriterleri:
- Upload -> convert -> pdf akisi calisir
- Job status polling UI tarafinda gorulur

### Faz 2 - Editor/Preview (Sprint 3-4)
Ama: WYSIWYG farkini azaltan preview ve editor kalitesi.
Sprint 3 Epics:
- Paged.js preview/print polish + self-healing
- PDF lint + accessibility preflight (heading/order/link)
- Editor iyilestirmeleri (shortcuts, autosave)
- Frontmatter wizard
Sprint 4 Epics:
- Markdown lint (heading hierarchy, empty heading, long paragraph)
- Empty/error state tasarimlari
- Performans iyilestirmeleri (cache, throttle)
Kabul kriterleri:
- Preview gercek PDF olarak gorunur
- Lint uyarilari bloklamadan gorunur

### Faz 3 - Template Sistemi (Sprint 5-6)
Ama: Template registry ve token mapping ile tasarim standardi.
Sprint 5 Epics:
- Templates CRUD (Supabase)
- Template versioning ve rollback
- Template preview (mini PDF/PNG)
Sprint 6 Epics:
- Press Pack manifest (template + tokens + patterns + QA rules + sample content)
- Block catalog (content schema + pattern mapping)
- Release metadata (output manifest + hash)
- Editorial/publish akisi + preflight gate entegrasyonu
- Template governance (versioning + approval workflow)
- Token mapping katmani (typografi/renk/spacing) + print token pack
- Pattern library (HeroStat, SurveyChartPage, WhatToDo)
- Tema paketleri: white, g10, g90, g100
- Governance UI (state + approval)
Kabul kriterleri:
- Template secimi end-to-end etkili
- Token mapping ile engine parity saglanir

### Faz 4 - Urunlesme (Sprint 7-8)
Ama: Operasyona hazir, guvenli ve izlenebilir urun.
Sprint 7 Epics:
- Release readiness (preflight gate + artifact retention + version stamping)
- Dokuman versiyonlama ve diff
- Usage stats (conversion count, storage)
- Monitoring temelleri (metrics endpoint + dashboard iskeleti)
- DoD enforcement (CI/PR checklist + release gate)
Sprint 8 Epics:
- Billing limitleri (free/pro)
- Security hardening (rate limit, scanning)
- Observability dashboard + alerting
- Release pipeline stabilizasyonu (rollback drill + publish audit log)
Kabul kriterleri:
- Kullanici rol/limitleri aktif
- Temel metrikler izlenebilir
- Release pipeline preflight + kalite checklist'ine bagli
- DoD enforcement CI/PR seviyesinde gorunur

Faz 4 Backlog Detayi (release/monitoring/DoD):
- Release: manifest dogrulama, artifact retention SLA, rollback rehearsal, publish audit log.
- Monitoring: latency/queue depth/error rate dashboard, alert kurallari, runbook linkleri.
- DoD: preflight/QA gate zorunlu, PR checklist + CI DoD step, manual test kaydi.

## 9. Mimarik ve Teknik Standartlar
API Standartlari:
- Error payload: code, message, details, request_id
- Log format: request_id + job_id
- Auth: Supabase JWT

Job Modeli:
- Status: queued -> processing -> completed/failed/cancelled
- Retry: max 3, exponential backoff

Queue:
- Kuyruklar: jobs:convert-md, jobs:convert-pdf
- Worker ayrilmis process

Storage:
- Supabase bucket path standardi (user_id/document_id/job_id)
- Signed URL ile access

## 10. Veri Modeli (Hedef)
- jobs, job_events (zorunlu)
- documents, document_versions
- templates, template_versions
- assets (uploads), outputs
- usage_events, billing_limits

## 11. Template ve Token Mapping
- Template ID standardi: carbon-<variant>
- Ortak token sozlugu: typography, color, spacing
- Engine mapping: typst + quarto ayni tokenlari kullanir
- Print token pack: baseline, safe-area, caption/footnote, chart spacing
- Pattern library: repeatable PDF modulleri (ExecutiveSummary, SurveyChartPage)
- Press Pack manifest: template + tokens + patterns + QA rules + sample content
- Content schema: docType, templateKey, layoutProfile, printProfile, theme, locale, version

## 12. AI Servis Katmani
- Endpointler: POST /api/ai/analyze, POST /api/ai/ask
- Rate limit ve audit log
- Prompt setleri versionlanir
- Gemini 3 Pro: spatial reasoning + data storytelling + print CSS logic
- Art director iki asama: DocumentPlan (semantik) + LayoutPlan (uzamsal)
- Veri sinirlari: max input size, pii redaction

## 13. Security ve Compliance
- File validation: mime/type/size
- Rate limit ve abuse kontrolu
- Secrets: server-side only
- RLS policy ve row-level access
- Storage lifecycle ve data retention

## 14. Observability ve Reliability
- Metrics: latency, success rate, queue depth
- Logs: request_id, job_id, user_id
- Tracing (opsiyonel): end-to-end conversion span
- SLO: p95 convert time, error rate

## 15. Test ve QA
- Unit test: parser, token mapping, validators
- Integration test: API + worker + storage
- E2E: upload -> convert -> preview
- Golden file: PDF snapshot karsilastirma
- Regression checklist her sprint
- PDF lint checklist (layout/contrast/typography)

## 16. Release ve Rollback
- Feature flags (critical path)
- Migration planlari ve rollback scriptleri
- Versioning: templates ve API contract
- Editorial states: draft -> review -> approved -> published
- Preflight gate: lint + AI QA basarisizsa publish edilmez
- Output manifest: template/version/tokens hash + QA sonucu

## 17. Riskler ve Onlemler
- Runtime bagimliliklari: containerized runtime
- AI key sizintisi: server-side proxy + rate limit
- Preview/convert farki: Paged.js print kurallari + visual self-healing
- Storage maliyeti: lifecycle policy

## 18. Teslimatlar
- API contract ve job state modeli
- Supabase migrations
- FE service refactor
- Template registry ve token mapping
- AI servis katmani
- Observability dashboard
- Dokumantasyon guncellemeleri

## 19. Mevcut Durum Profili (Snapshot)
- Faz 0 tamam: mimari kararlar, contract ve backlog kayitlari mevcut.
- Faz 1 tamam: job pipeline + Paged.js + Gemini art director + signed URL akisi dogrulandi.
- Faz 2 tamam: Sprint 3 preview/QA + autosave + frontmatter wizard tamam; Sprint 4 tamam.
- Faz 3 tamam: Sprint 5 template registry + preview + gallery tamam; Sprint 6 press pack + release/publish + preflight + governance UI tamam. Rollback policy enforce edildi ve 004/005 migrations uygulandi.
- Pi runtime stabil: Docker api/worker + Cloudflare SSH ile uzaktan calisma dogrulandi.

## 20. Sonraki Adimlar (Oncelik)
- Opsiyonel: alert esiklerini ortam KPI'larina gore kalibre et.

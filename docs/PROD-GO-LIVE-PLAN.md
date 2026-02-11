# Carbonac Production Go‑Live Uygulama Planı (SoT Uyumlu)

> **Kaynak:** `docs/PROD-GO-LIVE-AI-AGENT.md` checklist'i + SoT önceliği (`docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md`).
> **Amaç:** Carbonac’ın production ortamda güvenli, ölçeklenebilir, izlenebilir ve sürdürülebilir çalışması.

---

## 0) Amaç, Deliverables ve Başarı Kriterleri
**Amaç:** Production’da güvenli, ölçeklenebilir, izlenebilir ve sürdürülebilir çalışma.

**Deliverables:**
- Docker tabanlı production deploy planı (API + Worker + Redis)
- Supabase altyapısı ve RLS doğrulamaları
- Frontend prod build + doğru API konfigürasyonu
- İzleme (metrics), alert eşikleri, log standardı
- Güvenlik ve secret yönetimi
- Smoke/QA testleri

**Başarı Kriterleri:**
- API + Worker + Redis production’da stabil
- Frontend prod yayında ve E2E akış sorunsuz
- Observability & alerting çalışıyor
- RLS + secrets yönetimi güvenli
- Preflight/QA zinciri aktif

**SoT Uyum Notları:**
- Deploy modeli: Docker tabanlı Express API + Worker servisleri
- Queue: Redis + BullMQ
- Auth: Supabase JWT (Authorization: Bearer)
- API base URL: `VITE_API_URL`
- Logging: `request_id + job_id` zorunlu
- PDF kalite zinciri: statik lint + Gemini QA (self-healing)
- Press Pack + preflight gate + governance publish zorunlu

---

## 1) Ön Koşullar ve Secrets (System & Secrets)
**Hedef:** Tüm runtime ve secret bağımlılıkları hazır.

**Kontrol Listesi:**
- [ ] Node.js 20.19+
- [ ] Headless Chromium (PDF render)
- [ ] Redis erişimi (BullMQ)
- [ ] Supabase project + buckets + migrations
- [ ] Gemini API anahtarları (3 Pro + fallback)

**Gerekli env değişkenleri (özet):**
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_*`
- Queue: `REDIS_URL`, `JOB_QUEUE_NAME`
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`
- Observability: `METRICS_REQUIRE_AUTH`, `METRICS_TOKEN`, alert parametreleri

**Doğrulama:**
- `.env` ve CI secrets kontrolü
- `SUPABASE_SERVICE_ROLE_KEY` ve diğer kritik anahtarların frontend’e taşınmadığı doğrulanır

---

## 2) Altyapı ve Deploy Modeli (Docker)
**Hedef:** Docker tabanlı servisleri staging/production’da ayağa kaldır.

**Servisler:**
- [ ] `api` (Express)
- [ ] `worker` (Paged.js + Chromium)
- [ ] `redis`

**Referans:** `docker-compose.raspberry.yml`, `docs/RASPBERRY-DOCKER.md`

**Doğrulama:**
- Container healthcheck/logs
- API ve worker için temel log akışı

---

## 3) Supabase Kurulum ve Veri Katmanı
**Hedef:** Supabase yapılarını doğrula.

**Checklist:**
- [ ] Migrations uygulanmış (`supabase/migrations/*`)
- [ ] Buckets doğru (documents, pdfs, template-previews…)
- [ ] RLS politikaları doğrulanmış (User A / User B, 403 testi)
- [ ] `usage_events` tablosu aktif

**Doğrulama:**
- Supabase migration logları
- Bucket erişim testleri
- RLS izolasyon testi

---

## 4) API ve Worker Sağlık Kontrolleri
**Hedef:** temel uçların çalıştığını doğrula.

**Checklist:**
- [ ] `/api/convert/to-pdf` job oluşturabiliyor
- [ ] `/api/jobs/:id` job durumunu doğru döndürüyor
- [ ] `/api/jobs/:id/download` signed URL veriyor
- [ ] Queue depth ve retry davranışları stabil

**Doğrulama:**
- API smoke testleri
- Redis queue depth izlemesi

---

## 5) Frontend Production Build
**Hedef:** prod build yap ve doğru API endpoint’i ayarla.

**Checklist:**
- [ ] `VITE_API_URL` production API’ye işaret ediyor
- [ ] `frontend` build çıkışı CDN/host’a deploy edilmiş
- [ ] Preview + download akışı UI’dan uçtan uca çalışıyor

---

## 6) Observability, Metrics ve Alerting
**Hedef:** /api/metrics ve dashboard doğrulaması.

**Checklist:**
- [ ] `/api/metrics` endpoint aktif
- [ ] `METRICS_TOKEN` set ise `x-metrics-token` zorunlu
- [ ] Alert eşikleri (`p95`, `error rate`, `queue depth`) ayarlı
- [ ] SLO hedefleri doğrulanmış:
  - p95 latency < 800ms
  - queue depth < 20
  - job success rate > 95%

**Doğrulama:**
- Metrics endpoint testleri
- Dashboard/alert tetikleme senaryoları

---

## 7) Rate Limit & Abuse Önleme
**Hedef:** API/AI rate limit değerlerini ayarla.

**Checklist:**
- [ ] `AI_RATE_LIMIT_*` ve `API_RATE_LIMIT_*` aktif
- [ ] Aşım senaryoları 429 döndürüyor

---

## 8) Preflight QA & PDF Kalite Zinciri
**Hedef:** preflight, lint ve QA çıktısını doğrula.

**Checklist:**
- [ ] PDF lint (overflow, widows/orphans, min font)
- [ ] PDF accessibility checklist (heading/order/bookmarks/links)
- [ ] Output manifest metadata ve preflight sonucu kaydı
- [ ] `PUBLISH_REQUIRE_QUALITY_CHECKLIST` gerekiyorsa aktif

---

## 9) Smoke Test ve CI DoD Enforcements
**Hedef:** smoke/qa testlerini koştur.

**Checklist:**
- [ ] `scripts/tests/api-smoke.js`
- [ ] `scripts/tests/preflight-integration.js`
- [ ] CI DoD check geçmiş

---

## 10) Release / Publish Akışı
**Hedef:** press pack + template release yayın akışı doğrula.

**Checklist:**
- [ ] Press Pack schema validation çalışıyor
- [ ] Release metadata ve publish akışı doğru
- [ ] Governance/approval state’leri UI ve API’de tutarlı

---

## 11) Güvenlik ve Secrets Yönetimi
**Hedef:** secrets ve erişim katmanını denetle.

**Checklist:**
- [ ] Authorization: Bearer token zorunlu
- [ ] `METRICS_TOKEN` dış erişimi koruyor
- [ ] Supabase RLS policy’ler doğru

---

## 12) Operasyonel Runbook & Incident Akışı
**Hedef:** incident senaryolarını doğrula.

**Checklist:**
- [ ] API yavaşlık: queue depth + worker log kontrol prosedürü
- [ ] Yüksek hata: failed job event logları
- [ ] RLS ihlali: Supabase policy + audit log denetimi

**Referans:** `docs/OBSERVABILITY-RUNBOOK.md`, `docs/RASPBERRY-DOCKER.md`

---

## Tamamlandığında (Success Criteria)
- API + Worker + Redis production’da stabil
- Frontend prod yayında ve E2E akış sorunsuz
- Observability & alerting çalışıyor
- RLS + secrets yönetimi güvenli
- Preflight/QA zinciri aktif
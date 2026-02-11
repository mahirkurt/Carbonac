# AI Agent Talimatnamesi: Carbonac Production Go‑Live Checklist

> **Amaç:** Carbonac’ın production ortamda güvenli, ölçeklenebilir, izlenebilir ve sürdürülebilir şekilde çalışması.
> **SoT Önceliği:** `docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md` > diğerleri.
> **Runbook Referansları:** `docs/RASPBERRY-DOCKER.md`, `docs/OBSERVABILITY-RUNBOOK.md`.

## 0) Çıktılar (Deliverables)
- Production deployment planı (Docker tabanlı API + Worker + Redis)
- Çalışan Supabase altyapısı ve RLS doğrulamaları
- Frontend prod build ve doğru API konfigürasyonu
- İzleme (metrics), alert eşikleri, log standardı aktif
- Güvenlik ve secret yönetimi doğrulandı
- Smoke/QA testleri başarıyla geçti

## 1) Ön Koşullar ve Bağımlılıklar (System & Secrets)
**Agent görevi:** aşağıdaki bağımlılıkların hazır olduğunu doğrula.

- [ ] **Node.js 20.19+** (API/worker için zorunlu)
- [ ] **Headless Chromium** (PDF render için)
- [ ] Redis erişimi (BullMQ için)
- [ ] Supabase project + bucket’lar + migrations
- [ ] Gemini API anahtarları (3 Pro + fallback)

**Gerekli env değişkenleri (özet):**
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_*`
- Queue: `REDIS_URL`, `JOB_QUEUE_NAME`
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`
- Observability: `METRICS_REQUIRE_AUTH`, `METRICS_TOKEN`, alert parametreleri

**Güvenlik Notu:** `SUPABASE_SERVICE_ROLE_KEY` gibi kritik anahtarlar **frontend’e taşınamaz**.

## 2) Altyapı ve Deploy Modeli (Docker)
**Agent görevi:** Docker tabanlı servisleri staging/production’da ayağa kaldır.

- [ ] `api` servisi (Express)
- [ ] `worker` servisi (Paged.js + Chromium)
- [ ] `redis` servisi

**Referans:** `docker-compose.raspberry.yml` ve `docs/RASPBERRY-DOCKER.md`

## 3) Supabase Kurulum ve Veri Katmanı
**Agent görevi:** Supabase yapılarını doğrula.

- [ ] Migrations uygulanmış (`supabase/migrations/*`)
- [ ] Buckets doğru (documents, pdfs, template-previews…)
- [ ] RLS politikaları doğrulanmış
  - User A / User B erişim senaryosu ile `403` testi
- [ ] `usage_events` tablosu aktif (billing/kota izleme)

## 4) API ve Worker Sağlık Kontrolleri
**Agent görevi:** temel uçların çalıştığını doğrula.

- [ ] `/api/convert/to-pdf` job oluşturabiliyor
- [ ] `/api/jobs/:id` job durumunu doğru döndürüyor
- [ ] `/api/jobs/:id/download` signed URL veriyor
- [ ] Queue depth ve retry davranışları stabil

## 5) Frontend Production Build
**Agent görevi:** prod build yap ve doğru API endpoint’i ayarla.

- [ ] `VITE_API_URL` production API’ye işaret ediyor
- [ ] `frontend` build çıkışı CDN/host’a deploy edilmiş
- [ ] Preview + download akışı UI’dan uçtan uca çalışıyor

## 6) Observability, Metrics ve Alerting
**Agent görevi:** /api/metrics ve dashboard doğrulaması yap.

- [ ] `/api/metrics` endpoint aktif
- [ ] `METRICS_TOKEN` set ise `x-metrics-token` zorunlu
- [ ] Alert eşikleri (`p95`, `error rate`, `queue depth`) ayarlı
- [ ] SLO hedefleri doğrulanmış:
  - p95 latency < 800ms
  - queue depth < 20
  - job success rate > 95%

## 7) Rate Limit & Abuse Önleme
**Agent görevi:** API/AI rate limit değerlerini ayarla.

- [ ] `AI_RATE_LIMIT_*` ve `API_RATE_LIMIT_*` aktif
- [ ] Aşım senaryoları 429 döndürüyor

## 8) Preflight QA & PDF Kalite Zinciri
**Agent görevi:** preflight, lint ve QA çıktısını doğrula.

- [ ] PDF lint (overflow, widows/orphans, min font)
- [ ] PDF accessibility checklist (heading/order/bookmarks/links)
- [ ] Output manifest metadata ve preflight sonucu kaydı
- [ ] `PUBLISH_REQUIRE_QUALITY_CHECKLIST` gerekiyorsa aktif

## 9) Smoke Test ve CI DoD Enforcements
**Agent görevi:** smoke/qa testlerini koştur.

- [ ] `scripts/tests/api-smoke.js`
- [ ] `scripts/tests/preflight-integration.js`
- [ ] CI DoD check geçmiş

## 10) Release / Publish Akışı
**Agent görevi:** press pack + template release yayın akışını doğrula.

- [ ] Press Pack schema validation çalışıyor
- [ ] Release metadata ve publish akışı doğru
- [ ] Governance/approval state’leri UI ve API’de tutarlı

## 11) Güvenlik ve Secrets Yönetimi
**Agent görevi:** secrets ve erişim katmanını denetle.

- [ ] Authorization: Bearer token zorunlu
- [ ] `METRICS_TOKEN` dış erişimi koruyor
- [ ] Supabase RLS policy’ler doğru

## 12) Operasyonel Runbook & Incident Akışı
**Agent görevi:** incident senaryolarını doğrula.

- [ ] API yavaşlık: queue depth + worker log kontrol prosedürü
- [ ] Yüksek hata: failed job event logları
- [ ] RLS ihlali: Supabase policy + audit log denetimi

---

## Tamamlandığında (Success Criteria)
- API + Worker + Redis production’da stabil
- Frontend prod yayında ve E2E akış sorunsuz
- Observability & alerting çalışıyor
- RLS + secrets yönetimi güvenli
- Preflight/QA zinciri aktif
# PRODUCTION GO‑LIVE PLAN (Nihai Konsolide)

> **SoT Önceliği:** `docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md` > diğerleri.  
> **Kaynak:** `docs/PROD-GO-LIVE-AI-AGENT.md`, `docs/PROD-GO-LIVE-PLAN.md`, `docs/RASPBERRY-DOCKER.md`, `docs/PROJE-DURUMU.md`.
> **Amaç:** Production ortamında güvenli, ölçeklenebilir, izlenebilir ve sürdürülebilir çalışma için tekil, güncel ve uygulanabilir plan.

---

## 0) Amaç, Deliverables ve Başarı Kriterleri
**Amaç:** Production’da güvenli, ölçeklenebilir, izlenebilir ve sürdürülebilir çalışma.

**Deliverables:**
- Docker tabanlı production deploy planı (API + Worker + Redis)
- Supabase altyapısı ve RLS doğrulamaları
- Frontend prod build + doğru API konfigürasyonu
- İzleme (metrics), alert eşikleri, log standardı
- Güvenlik ve secret yönetimi doğrulaması
- Smoke/QA testleri

**Başarı Kriterleri:**
- API + Worker + Redis production’da stabil
- Frontend prod yayında ve E2E akış sorunsuz
- Observability & alerting çalışıyor
- RLS + secrets yönetimi güvenli
- Preflight/QA zinciri aktif

**SoT uyum notu:** Üretime çıkış kararlarında `docs/PROJE-TALIMATLARI.md` ve DoD koşulları bağlayıcıdır.

---

## 1) Ön Koşullar ve Secrets (System & Secrets)
**Hedef:** Tüm runtime ve secret bağımlılıkları hazır.

**Kontrol Listesi:**
- [x] Node.js 20.19+
- [x] Headless Chromium (PDF render)
- [ ] Redis erişimi (BullMQ)
- [x] Supabase project + buckets + migrations
- [ ] Gemini API anahtarları (3 Pro + fallback)

**Gerekli env değişkenleri (özet):**
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_*`
- Queue: `REDIS_URL`, `JOB_QUEUE_NAME`
- Frontend: `VITE_API_URL`, `VITE_SUPABASE_URL`
- Observability: `METRICS_REQUIRE_AUTH`, `METRICS_TOKEN`, alert parametreleri
- Rate limit: `API_RATE_LIMIT_*`, `AI_RATE_LIMIT_*`

**Doğrulama:**
- [x] `.env` ve CI secrets kontrolü
- [x] `SUPABASE_SERVICE_ROLE_KEY` ve diğer kritik anahtarlar frontend’e taşınmıyor
- [x] Gemini fallback model (2.5 Pro) aktif ve güvenli proxy üzerinden çağrılıyor
- [x] `VITE_API_URL` yalnızca backend API’yi işaret ediyor

---

## 2) Altyapı ve Deploy Modeli (Docker)
**Hedef:** Docker tabanlı servisleri staging/production’da ayağa kaldır.

**Servisler:**
- [x] `api` (Express)
- [x] `worker` (Paged.js + Chromium)
- [x] `redis`

**Referans:** `docker-compose.raspberry.yml`, `docs/RASPBERRY-DOCKER.md`

**Pi/Remote notu:** Raspberry profile’ları ile `api` ve `worker` ayrı çalıştırılır; remote deploy için `scripts/raspberry/pi_bridge.py` kullanılabilir.

**Profil çalıştırma örnekleri:**
- `docker compose -f docker-compose.raspberry.yml --profile api up -d`
- `docker compose -f docker-compose.raspberry.yml --profile worker up -d`
- `docker compose -f docker-compose.raspberry.yml --profile api --profile worker up -d`

**Doğrulama:**
- [x] Container healthcheck/logs
- [x] API ve worker için temel log akışı

---

## 3) Supabase Kurulum ve Veri Katmanı
**Hedef:** Supabase yapılarını doğrula.

**Checklist:**
- [x] Migrations uygulanmış (`supabase/migrations/*`)
- [x] Buckets doğru (documents, pdfs, template-previews…)
- [x] RLS politikaları doğrulanmış (User A / User B, 403 testi)
- [x] `usage_events` tablosu aktif
- [x] Storage path standardı (user_id/document_id/job_id) doğrulanmış

**Doğrulama:**
- [x] Supabase migration logları
- [x] Bucket erişim testleri
- [x] RLS izolasyon testi
- [x] Template registry CRUD ve press pack okuma testi

---

## 4) API ve Worker Sağlık Kontrolleri
**Hedef:** temel uçların çalıştığını doğrula.

**Checklist:**
- [x] `/api/convert/to-pdf` job oluşturabiliyor
- [x] `/api/jobs/:id` job durumunu doğru döndürüyor
- [x] `/api/jobs/:id/download` signed URL veriyor
- [x] Queue depth ve retry davranışları stabil
- [x] Error payload formatı (code, message, details, request_id) doğrulanmış

**Doğrulama:**
- [x] API smoke testleri
- [x] Redis queue depth izlemesi
- [x] Worker loglarında render/pagination aşamaları izleniyor

---

## 5) Frontend Production Build
**Hedef:** prod build yap ve doğru API endpoint’i ayarla.

**Checklist:**
- [x] `VITE_API_URL` production API’ye işaret ediyor
- [x] `frontend` build çıkışı CDN/host’a deploy edilmiş
- [ ] Preview + download akışı UI’dan uçtan uca çalışıyor
- [ ] Template gallery + governance panel production’da görünür

---

## 6) Observability, Metrics ve Alerting
**Hedef:** /api/metrics ve dashboard doğrulaması.

**Checklist:**
- [x] `/api/metrics` endpoint aktif
- [x] `METRICS_TOKEN` set ise `x-metrics-token` zorunlu
- [x] Alert eşikleri (`p95`, `error rate`, `queue depth`) ayarlı
- [ ] SLO hedefleri doğrulanmış:
  - p95 latency < 800ms
  - queue depth < 20
  - job success rate > 95%
  - API availability >= 99.5%
  - error rate < 1%

**Doğrulama:**
- [x] Metrics endpoint testleri
- [x] Dashboard/alert tetikleme senaryoları
- [x] Alert runbook linkleri güncel (`docs/OBSERVABILITY-RUNBOOK.md`)

---

## 7) Rate Limit & Abuse Önleme
**Hedef:** API/AI rate limit değerlerini ayarla.

**Checklist:**
- [x] `AI_RATE_LIMIT_*` ve `API_RATE_LIMIT_*` aktif
- [x] Aşım senaryoları 429 döndürüyor
- [x] `METRICS_REQUIRE_AUTH=true` ise dış erişim token ile korunuyor
- [ ] AI audit log istekleri job/request_id ile izleniyor

---

## 8) Preflight QA & PDF Kalite Zinciri
**Hedef:** preflight, lint ve QA çıktısını doğrula.

**Checklist:**
- [ ] PDF lint (overflow, widows/orphans, min font)
- [x] PDF accessibility checklist (heading/order/bookmarks/links)
- [x] Output manifest metadata ve preflight sonucu kaydı
- [ ] `PUBLISH_REQUIRE_QUALITY_CHECKLIST` gerekiyorsa aktif
- [x] Quality checklist (EK‑GELISTIRME maddeleri) preflight raporuna bağlı
- [ ] Visual regression baseline’ları mevcut
- [ ] QA fail → auto-fix → re-render → AI self-healing akışı doğrulandı

---

## 9) Smoke Test ve CI DoD Enforcements
**Hedef:** smoke/qa testlerini koştur.

**Checklist:**
- [x] `scripts/tests/api-smoke.js`
- [x] `scripts/tests/preflight-integration.js`
- [ ] CI DoD check geçmiş
- [ ] QA artifact’ları (`output/`) CI’da upload ediliyor
- [ ] `RUN_QA` / `RUN_SMOKE` bayraklarıyla koşullu çalıştırma doğrulandı

---

## 10) Release / Publish Akışı
**Hedef:** press pack + template release yayın akışı doğrula.

**Checklist:**
- [x] Press Pack schema validation çalışıyor
- [x] Release metadata ve publish akışı doğru
- [ ] Governance/approval state’leri UI ve API’de tutarlı
- [ ] Output manifest: template/version/tokens hash + QA sonucu içeriyor
- [x] Draft → review → approved → published geçişleri test edildi

---

## 11) Güvenlik ve Secrets Yönetimi
**Hedef:** secrets ve erişim katmanını denetle.

**Checklist:**
- [x] Authorization: Bearer token zorunlu
- [x] `METRICS_TOKEN` dış erişimi koruyor
- [x] Supabase RLS policy’ler doğru
- [x] File validation: mime/type/size kontrolü aktif

---

## 12) Operasyonel Runbook & Incident Akışı
**Hedef:** incident senaryolarını doğrula.

**Checklist:**
- [ ] API yavaşlık: queue depth + worker log kontrol prosedürü
- [ ] Yüksek hata: failed job event logları
- [ ] RLS ihlali: Supabase policy + audit log denetimi
- [ ] Pi deploy rollback prosedürü doğrulandı

**Referans:** `docs/OBSERVABILITY-RUNBOOK.md`, `docs/RASPBERRY-DOCKER.md`

---

## 13) Domain & Frontend Deploy (Opsiyonel)
**Hedef:** Prod domain yönlendirmeleri doğru.

- [ ] `api.carbonac.com` → Cloudflare tunnel ingress (TLS Full)
- [ ] Netlify `VITE_API_URL=https://api.carbonac.com`
- [ ] Custom domain SSL aktif

---

## Tamamlandığında (Success Criteria)
- API + Worker + Redis production’da stabil
- Frontend prod yayında ve E2E akış sorunsuz
- Observability & alerting çalışıyor
- RLS + secrets yönetimi güvenli
- Preflight/QA zinciri aktif

# Observability Runbook

Bu dokuman, Carbonac servislerinin izlenebilirlik, guvenlik ve kullanim izleme (billing) kurallarini standartlastirir.

## 1) Temel Log Kurallari

- API loglari JSON formatinda yazilir ve `requestId`, `userId`, `jobId`, `status`, `durationMs` alanlarini icerir.
- `x-request-id` header'i yoksa sunucu uretir.
- Job bazli endpointlerde `jobId` request context'e eklenir.

## 2) Metrics Endpoint

- Endpoint: `GET /api/metrics`
- Dashboard: `GET /api/metrics/dashboard`
- Varsayilan: auth aktifse authentication gerektirir.
- Opsiyonel gizli token: `METRICS_TOKEN` set edilirse `x-metrics-token` header'i zorunludur.

Dondurulen metrikler:
- request: toplam istek, hata oranlari, p50/p95/p99, ortalama gecikme
- queue: waiting/active/failed/completed/delayed + depth
- alerts: SLO esikleri asilirsa uyarilar listelenir

Env:
- `METRICS_REQUIRE_AUTH` (default: true)
- `METRICS_TOKEN` (opsiyonel)
- `METRICS_WINDOW_SIZE` (default: 500)
- `METRICS_ALERT_ENABLED` (default: true)
- `METRICS_ALERT_P95_MS` (default: 800)
- `METRICS_ALERT_ERROR_RATE` (default: 5)
- `METRICS_ALERT_QUEUE_DEPTH` (default: 20)

## 3) Rate Limit

- AI proxy rate limit: `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX`
- API rate limit (PDF/MD donusumleri): `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`

## 4) Usage Events (Billing/Quota)

- AI endpointleri ve PDF/MD donusumleri `usage_events` tablosuna yazilir.
- Event tipleri:
  - `ai.analyze`, `ai.ask`
  - `convert.pdf`, `convert.md`

Bu tablolar faturalandirma, kotas, ve internal raporlamada kullanilir.

## 5) RLS Politikasi Dogrulama

- Supabase Dashboard > Auth > Policies uzerinden `documents`, `jobs`, `templates` tablolarini kontrol et.
- Test senaryosu:
  - User A ile job olustur.
  - User B token'i ile /api/jobs/:id dene, `403` beklenir.

## 6) Secrets Management

- Server secret'lari sadece backend `.env` ile tanimlanir.
- Frontend sadece `VITE_` prefiksli degiskenleri tuketir.
- `SUPABASE_SERVICE_ROLE_KEY` gibi kritik anahtarlar frontend'e aktarilmaz.

## 7) SLO Takibi

- Hedefler:
  - p95 latency < 800ms (api)
  - queue depth < 20
  - job success rate > 95%
- Paneller: `GET /api/metrics/dashboard` SLO anlik gorunumu verir.

## 8) Incident Rehberi

- API yavaslik: queue depth + worker loglari kontrol
- Yuksek hata: /api/jobs listesi + failed event loglari
- RLS ihlali: Supabase policy dogrulama + audit log

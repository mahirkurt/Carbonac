# Backend Production Hardening — Design Document

**Date:** 2026-02-27
**Approach:** Production Hardening (critical + high priority fixes)
**Scope:** 7 files, 8 changes, 0 new files

## Problem Statement

Backend altyapısı mimari olarak sağlam ancak production ortamında (Docker on Pi + HP) tam güvenilirlikle çalışması için kritik eksiklikler var: graceful shutdown yok, rate limiting bellek sızıntısı yapıyor, güvenlik açığı mevcut, startup validation eksik, infra script yanlış dosya referans ediyor.

## Design Decisions

### 1. Graceful Shutdown (server.js, worker.js)

**Problem:** `server.js` HTTP server referansını saklamıyor, SIGTERM handler yok. Docker `docker stop` SIGTERM gönderir — mevcut kodda yakalanmıyor. Worker'da sadece SIGINT var.

**Solution:**
- `server.js`: `app.listen()` sonucunu `const server` olarak sakla. SIGTERM + SIGINT handler'ları ekle: `server.close()` → `connection.quit()` → `process.exit(0)`.
- `worker.js`: Mevcut SIGINT handler'ı `gracefulShutdown(signal)` fonksiyonuna dönüştür. SIGTERM'i de aynı fonksiyona bağla. `worker.close()` mevcut job'ların bitmesini bekler.

**Files:** `backend/server.js`, `backend/worker.js`

### 2. Redis-Backed Rate Limiting (middleware/rate-limit.js)

**Problem:** In-memory `Map` kullanımı: restart'ta sıfırlanır, key'ler hiç silinmez (memory leak), multi-instance'da paylaşılmaz.

**Solution:** Redis `INCR` + `PEXPIRE` pattern'i. Zaten mevcut olan `connection` (queue.js) kullanılır.
- Bucket key: `rl:{rateKey}:{Math.floor(Date.now() / windowMs)}`
- İlk INCR'da PEXPIRE ile TTL set edilir — otomatik cleanup
- Redis bağlantı hatalarında fail-open (izin ver) — rate limit yüzünden API kilitlenmez
- In-memory Map'ler tamamen kaldırılır
- Mevcut env var'lar korunur (`API_RATE_LIMIT_WINDOW_MS`, vb.)

**Files:** `backend/middleware/rate-limit.js`

### 3. isReviewer() Güvenlik Düzeltmesi (lib/helpers.js)

**Problem:** `REVIEWER_USER_IDS` env var'ı boşsa `isReviewer()` herkese `true` döner — template/press pack review işlemleri herkese açık.

**Solution:** Boş liste = `false` (kimse yetkili değil). Startup'ta `console.warn` ile uyarı.

**Files:** `backend/lib/helpers.js`

### 4. env.js Startup Validation (env.js)

**Problem:** `env.js` sadece `dotenv.config()` çağırıyor — kritik env var eksikse hata ilk kullanımda ortaya çıkıyor.

**Solution:** İki katmanlı validation:
- **Required** (`REDIS_URL`): Eksikse `process.exit(1)` — fail-fast
- **Recommended** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`): Eksikse `console.warn` — graceful degradation korunur

**Files:** `backend/env.js`

### 5. infra.py Compose Dosyası Düzeltmesi (scripts/infra.py)

**Problem:** Pi konfigürasyonu legacy `docker-compose.raspberry.yml` referans ediyor. Bu dosya artık `.tmp/netlify-clean/`'de. Gerçek compose dosyası profile-based `docker-compose.yml`.

**Solution:**
- `PI_COMPOSE_FILE`: `docker-compose.raspberry.yml` → `docker-compose.yml`
- `PI_PROFILE`: `api` → `pi`
- `PI_ENV_FILES`: `--env-file .env` → `--env-file .env --env-file .env.pi`

**Files:** `scripts/infra.py`

### 6. Queue Connection Dayanıklılığı (queue.js)

**Problem:** Redis bağlantı hatası sadece log'lanıyor, reconnect stratejisi yok.

**Solution:** IORedis built-in retry:
- `retryStrategy`: Max 20 deneme, üstel gecikme (200ms → 5s cap)
- `reconnectOnError`: READONLY hatalarında (failover) otomatik reconnect
- `connect`, `reconnecting` event log'ları

**Files:** `backend/queue.js`

### 7a. Docker Legacy Temizliği (Dockerfile.worker, docker-compose.yml)

**Problem:** `INSTALL_TYPST` ve `INSTALL_QUARTO` build arg'ları — kullanılmıyor, Paged.js tek engine.

**Solution:** Build arg'ları Dockerfile.worker ve docker-compose.yml'den kaldır.

**Files:** `docker/Dockerfile.worker`, `docker-compose.yml`

### 7b. API Health Check (docker-compose.yml)

**Problem:** API container health check'i `redis-healthcheck.js` çalıştırıyor — Redis'i test eder, API'nin HTTP yanıt verdiğini test etmez.

**Solution:** HTTP-based health check: `fetch('http://localhost:3001/api/health')`. Worker health check'i Redis-based kalır (HTTP sunmuyor).

**Files:** `docker-compose.yml`

### 8. .env.example Belgeleme (.env.example)

**Problem:** 9 env var kodda kullanılıyor ama `.env.example`'da yok.

**Solution:** Şu değişkenleri ekle: `PYTHON_BIN`, `KEEP_TEMP_FILES`, `API_RATE_LIMIT_WINDOW_MS`, `API_RATE_LIMIT_MAX`, `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX`, `REVIEWER_USER_IDS`, `REDIS_SKIP_VERSION_CHECK`, `JOB_QUEUE_NAME`.

**Files:** `.env.example`

## Out of Scope

- Billing routes implementasyonu (stub kalacak)
- Google Docs import iyileştirmesi (plain text kalacak)
- Preflight eşikleri konfigürasyonu (hardcoded kalacak)
- Docker multi-stage build (image boyutu optimizasyonu)
- Supabase storage bucket migration'ları

## File Impact Summary

| File | Change Type |
|------|-------------|
| `backend/server.js` | Edit — graceful shutdown |
| `backend/worker.js` | Edit — SIGTERM handler |
| `backend/middleware/rate-limit.js` | Edit — Redis-backed |
| `backend/lib/helpers.js` | Edit — isReviewer fix |
| `backend/env.js` | Edit — startup validation |
| `backend/queue.js` | Edit — retry strategy + reconnect |
| `scripts/infra.py` | Edit — compose file path |
| `docker/Dockerfile.worker` | Edit — remove legacy args |
| `docker-compose.yml` | Edit — remove args + API health check |
| `.env.example` | Edit — add 9 vars |

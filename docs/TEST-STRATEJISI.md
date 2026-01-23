# TEST STRATEJISI (GUNCEL)

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ile uyumlu olmalidir. Cakisma varsa SoT gecerlidir.

## 1. Amac ve Kapsam
- Core pipeline dogrulama: API -> queue -> worker -> output.
- Paged.js render ve print CSS kurallarinin dogrulanmasi.
- AI layout kararlarinin schema/whitelist uyumlulugu.
- Storage signed URL akisi ve expiry yenileme.
- Governance, release ve preflight gate kurallarinin dogrulanmasi.

## 2. Test Katmanlari
- Unit: markdown parser, frontmatter generation, schema validatorlar.
- Integration: API endpointleri, job queue, Redis, storage.
- Contract: API payload schema (layoutProfile/printProfile, press pack, release).
- E2E: convert -> polling -> download signed URL akisi.
- Regression: golden fixtures (sample markdown + expected manifest).
- Performance: p95 convert time ve queue wait hedefleri.

## 3. Ortam Matrisi
- Local WSL: unit + schema + basic integration (mock storage).
- Pi (docker): full pipeline smoke ve latency kontrolu.
- CI: unit + integration default, QA + smoke opsiyonel (workflow_dispatch).
- Staging (plan): E2E + performance + QA harness.

## 4. Test Verisi ve Fixture
- Minimal markdown fixture (title + heading + paragraph).
- Data/tablolu fixture (chart + table + list).
- Press Pack manifest fixture (schema version + tokens + patterns + QA rules).
- Release manifest fixture (output manifest + artifact list).
- Pattern library fixture (`examples/patterns/pattern-library.md`).

## 5. Otomasyon ve Araclar (Plan)
- Unit: `npm run test:unit` (`src/test.js`).
- Integration: `npm run test:integration` (preflight evaluation).
- Smoke: `npm run test:smoke` (API_BASE_URL + API_AUTH_TOKEN gerekir).
- QA harness: `npm run test:qa` (Chromium + opsiyonel Gemini).
- Token lint: `npm run lint:tokens` (print CSS hex/px kontrolu).
- CI: `.github/workflows/ci.yml` (RUN_QA/RUN_SMOKE opsiyonel).
- Optional local/CI: `RUN_QA=true RUN_SMOKE=true npm run test:optional` (kosullu QA + smoke).

QA harness kapsami:
- axe-core audit (`scripts/vendor/axe.min.js`)
- typography scoring (line length/line height/hyphenation density)
- visual regression (baseline + diff) (`scripts/vendor/visual_diff.py`)
- baseline yolu: `output/qa-baselines`, diff yolu: `output/qa-diffs`
- QA raporu: JSON + HTML (qa-report.json / qa-report.html)
- Iterasyon bazli diff log: `qaReport.diffLog`

## 6. Gatelar ve Kabul Kriterleri
- Preflight gate fail ise publish olmamali.
- Preflight sonucunda qualityChecklist (EK-GELISTIRME) raporu uretilmeli.
- Signed URL yenileme basarili olmali (expiresAt > 30s).
- Job status akisi: queued -> processing -> completed/failed.
- Output manifest alanlari zorunlu (template/version/hash/qa).

## 7. Bu Calismada Icra Edilen Testler
- `npm test` (root): unit + integration PASS.
- Pi smoke: `/api/convert/to-pdf` -> job completed -> download 200.
- API container runtime: docker compose healthcheck PASS.
- Migration smoke: Supabase 004/005 uygulandi.

## 8. Takip Edilecek Metrikler
- p95 convert time ve queue wait (IS-PLANI KPI).
- Error rate (5xx) ve job failure rate.
- QA blocking issue oranlari.
- Template governance approval gecikmesi.

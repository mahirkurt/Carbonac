# REPO HARITASI (Carbonac)

> Amac: Repo yapisini, ana pipeline akisini, build/test/CI durumunu ve SoT uyum kurallarini tek sayfada ozetlemek.

## 1) Ust seviye dizinler
- `backend/`: Express API + queue + worker entegrasyonu, Supabase store, press-pack ve release API.
- `frontend/`: React UI (upload -> wizard -> editor -> preview), template gallery, lint panel.
- `src/`: Paged.js render + QA harness + CLI girisleri + util modul.
- `styles/`: print CSS profilleri (pagedjs-a4/a3), base print kurallari ve font embed assets.
- `tokens/`: core/print/theme token pack'leri.
- `supabase/`: migrations ve schema dosyalari.
- `scripts/`: test/automation scriptleri + QA harness + vendor QA araclari.
- `docs/`: SoT, sprint planlari, runbook ve durum dokumanlari.
- `templates/`: template ornekleri (layout/print/theme bazli).
- `patterns/`: pattern registry ve props schema dosyalari.
- `examples/`: fixtures ve QA ornekleri (pattern-library dahil).

## 2) Core pipeline akisi (API -> queue -> worker)
1) FE `POST /api/convert/to-pdf`
2) API `backend/server.js` job kaydi + queue add
3) Worker `backend/worker.js` -> `src/convert-paged.js`
4) Paged.js render + QA harness + output manifest
5) Storage upload + signed URL
6) FE polling + download/preview

Ana dosyalar:
- API: `backend/server.js`
- Queue: `backend/queue.js`
- Worker: `backend/worker.js`
- Storage: `backend/storage.js`
- Job store: `backend/job-store.js`
- Preflight: `backend/preflight.js`
- Press Pack: `backend/press-pack-schema.js`, `backend/press-pack-store.js`
- Release: `backend/release-store.js`
- Render: `src/convert-paged.js`

## 3) UI akisi (route yok, workflow step var)
Workflow step'leri `frontend/src/contexts/DocumentContext.jsx`:
- upload -> processing -> wizard -> editor -> preview

UI ana bileşenler:
- `frontend/src/App.jsx`: ana layout + workflow
- `frontend/src/components/...`: upload/wizard/editor/preview/template gallery

## 4) Render/QA zinciri (Paged.js)
- Print profilleri: `styles/print/print-base.css`, `styles/print/pagedjs-a4.css`, `styles/print/pagedjs-a3.css`
- Paged.js render + QA: `src/convert-paged.js`
  - static lint (overflow/orphan/widow)
  - auto-fix + smart table split (avoid-break/force-break)
  - SVG chart renderer (grayscale/pattern palette)
  - QA harness: `scripts/tests/qa-harness.js`
    - accessibility (axe), typography scoring, visual diff
  - Gemini QA (opsiyonel)
- Tipografi ve chart/table kurallari: `docs/TIPOGRAFI-KURALLARI.md`, `docs/CHART-TABLE-STANDARDS.md`

## 5) Build/Test/CI
- Root `package.json` scriptleri:
  - `npm test` (unit + integration)
  - `npm run test:qa`
  - `npm run test:smoke`
  - `npm run lint:tokens`
- CI: `.github/workflows/ci.yml`
  - unit + integration default
  - QA/smoke opsiyonel (workflow_dispatch)

## 6) SoT enforcement checklist
- SoT dokumani: `docs/PROJE-TALIMATLARI.md`
- Degisiklik kuralı:
  - SoT degisirse ilgili plan/sprint dokumanlari da guncellenmeli.
- PR checklist:
  - SoT degisimi varsa plan/sprint dokumani guncellendi mi?
- CI kontrolu (plan):
  - SoT degisimi + bagli dokuman degisimi yoksa fail.

## 7) Paket hijyeni notu (Carbon v11)
- Root dependencies: `@carbon/*` 11.x seti
- Frontend: `@carbon/react` 1.x (Carbon v11 ile uyumlu), `@carbon/icons-react` 11.x
- Not: Frontend tarafinda `@carbon/styles` dogrudan bagimlilik degil. Gerekirse versiyon sabitleme planlanmali.

## 8) CarbonPress uyumu (alinacaklar / alinmayacaklar)
Alinacaklar:
- AST/Directive pipeline
- QA/preflight katmani
- Typography + print guardrails
- Postprocess (PDF metadata, watermark, optimize)

Alinmayacaklar:
- React tek kaynak gorunum ilkesini bozan ikinci template motoru (Nunjucks vb.)

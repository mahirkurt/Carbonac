# FAZ 2 - SPRINT 4 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md` ve `docs/IS-PLANI.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 4, editor tarafinda kalite ve guvenilirlik katmanini tamamlar: Markdown lint (non-blocking), empty/error state tasarimi ve performans iyilestirmeleri (cache/throttle).

## 1. Amac ve Kapsam
Sprint 4, preview ve export pipeline'ini degistirmeden, editor UX kalitesini ve tutarliligini artirir.

Kapsam dahili:
- Markdown lint kurallari (heading hiyerarsi, empty heading, uzun paragraf, duplike baslik)
- Lint ciktisinin non-blocking gosterimi (uyari seviyesi)
- Empty/error state tasarimlari (upload, editor, preview, job)
- Performans iyilestirmeleri (debounce, throttle, cache)

Kapsam disi:
- Template registry ve token mapping (Sprint 5-6)
- Billing ve usage limitleri (Sprint 7-8)

## 2. Sprint 0 Kararlari (Uygulanan)
- Deploy: Docker tabanli Express API + Worker
- Queue: Redis + BullMQ
- Rendering: React + Carbon Components
- Baski/PDF: Paged.js (print CSS + sayfalandirma)
- Storage: Supabase buckets, standard path
- AI provider: Gemini 3 Pro (preview) + 2.5 Pro fallback
- API base URL: `VITE_API_URL`
- Error format ve logging standardi (request_id + job_id)

## 3. Cikti ve Basari Kriterleri (Exit)
- Lint uyarilari bloklamadan gosterilir ve export devam eder.
- Empty/error state'ler tum ana akislarda tutarlidir.
- Editor aksiyonlari (preview, convert, autosave) belirgin gecikme olmadan calisir.

## 4. Teknik Tasarim Ozeti

### 4.1 Markdown Lint Pipeline
- Lint kurallari editor tarafinda calisir (non-blocking).
- Default kurallar: heading hiyerarsi, empty heading, uzun paragraf, duplike baslik.
- Cikti format: { ruleId, severity, message, line, column }.
- Esikler: uzun paragraf >= 120 kelime veya >= 800 karakter.
- Severity: heading-order/empty-heading = warning, duplicate-heading/long-paragraph = info.

### 4.2 Lint UI/UX
- Lint sonuclari "warning/info" seviyesinde listelenir.
- Export/preview aksiyonlarini bloklamaz.
- Uyari sayisi ve filtre (rule/severity) desteklenir.

### 4.3 Empty/Error State Tasarimlari
- Upload yokken, preview bosken, job hatasinda tutarli state kartlari.
- Error payload standardi (code/message/request_id) UI'a yansir.

### 4.4 Performans Iyilestirmeleri
- Editor input debounce (ornek: 300-500ms).
- Preview refresh throttle.
- Lint cache (icerik hash'e gore).
- API polling backoff (mevcut akisa uygun).

### 4.5 Ortam Degiskenleri (Minimum)
- FE: `VITE_API_URL`
- API: `REDIS_URL`, `JOB_QUEUE_NAME`, `PORT`, `NODE_ENV`

## 5. Entegrasyon Akisi (Is Adimi)
1) Editor -> markdown lint (non-blocking)
2) Editor -> preview (PDF preview)
3) Preview/export -> mevcut job pipeline
4) Error payload -> UI error state

## 6. Sprint Takvimi
- G1-G2: Markdown lint kurallari + UI
- G3-G4: Empty/error state tasarimi
- G5-G7: Performans iyilestirmeleri (debounce/throttle/cache)
- G8-G9: Entegrasyon + polish
- G10: Test, demo ve kapanis

## 7. Sprint 4 Backlog (Issue-Based)

### ISSUE F2-S4-01: Markdown Lint Engine
Labels: [FE] [QUALITY]
Goal: Lint kurallari ve non-blocking pipeline.
Tasks:
- [x] Heading hiyerarsi kurali
- [x] Empty heading kurali
- [x] Uzun paragraf kurali
- [x] Duplike baslik kurali
Acceptance:
- [x] Lint uyarilari exportu bloklamaz

### ISSUE F2-S4-02: Lint UI/UX
Labels: [FE] [UX]
Goal: Lint sonuclarini okunabilir sekilde goster.
Tasks:
- [x] Uyari listesi ve sayac
- [x] Severity/Rule filtreleri
- [x] Satir/kolon highlight (opsiyonel)
Acceptance:
- [x] Lint uyarilari editor akisini kesmez

### ISSUE F2-S4-03: Empty/Error States
Labels: [FE] [UX]
Goal: Tutarli empty/error state seti.
Tasks:
- [x] Upload bos state
- [x] Preview bos state
- [x] Job failure/error state
- [x] Retry CTA ve error details
Acceptance:
- [x] Tum akislarda standart state'ler gorunur

### ISSUE F2-S4-04: Performans Iyilestirmeleri
Labels: [FE] [PERF]
Goal: Editor ve preview performansini iyilestir.
Tasks:
- [x] Editor debounce
- [x] Preview throttle
- [x] Lint cache
- [x] Polling backoff dogrulama
Acceptance:
- [x] Editor ve preview gecikmesi azalir

## 8. Ayrintili Task Breakdown

### F2-S4-01 Markdown Lint Engine
Breakdown:
- [x] Rule set tanimi (id, severity, message)
- [x] AST veya regex tabanli hizli kontrol
- [x] Lint output schema
Notlar:
- Lint non-blocking ve hizli olmali.

### F2-S4-02 Lint UI/UX
Breakdown:
- [x] Lint badge + count
- [x] Lint paneli ve filtreler
- [x] Satir/kolon navigasyonu (opsiyonel)
Notlar:
- Uyarilar exportu engellememeli.

### F2-S4-03 Empty/Error States
Breakdown:
- [x] Empty state copy + CTA
- [x] Error payload map (code/message/request_id)
- [x] Retry aksiyonlari
Notlar:
- UI dili sade ve tutarli olmali.

### F2-S4-04 Performans Iyilestirmeleri
Breakdown:
- [x] Debounce/throttle util'leri
- [x] Lint memoization (content hash)
- [x] Preview refresh policy
- [x] Polling backoff dogrulama (1s -> 5s)
Notlar:
- Performans iyilestirmeleri olculebilir olmali.

## 9. Bagimliliklar
- F2-S4-02 -> F2-S4-01 tamamlanmadan kapanmaz
- F2-S4-04 -> F2-S4-01 ile paralel gidebilir

## 10. Test ve Dogrulama
Minimum test senaryolari:
- [x] Lint uyarilari olusturup export yapma
- [x] Empty state gorunumleri
- [x] Error payload -> UI error state
- [x] Debounce/throttle etkisi (manuel test)

## 11. Cikti Artefaktlari
- Lint rule set dokumani
- Empty/error state UI seti
- Performans notlari (debounce/throttle parametreleri)

## 12. CarbonPress Uyum Notu
- Markdown lint, Press Pack preflight kapisinin statik asamasidir.
- Lint raporu, release manifest'e eklenecek.

## 13. Guncel Durum Profili
- Sprint 4 backlog'u tamamlandi; lint/empty state/perf iyilestirmeleri aktif.

## 14. Sonraki Adimlar
- Press Pack preflight gate icin lint + QA raporu birlestirilsin.
- Sprint 6: Press Pack manifest + block catalog + release metadata backlog'u baslatilsin.

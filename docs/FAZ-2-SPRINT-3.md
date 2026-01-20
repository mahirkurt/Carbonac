# FAZ 2 - SPRINT 3 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md` ve `docs/IS-PLANI.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 3, editor/preview kalitesini artirir: Paged.js preview polish, visual self-healing (AI QA) ve frontmatter wizard.

## 1. Amac ve Kapsam
Sprint 3, Phase 2 baslangic adimi olarak preview ile PDF arasindaki farklari azaltir ve editor deneyimini guclendirir.

Kapsam dahili:
- Paged.js preview/print polish (print CSS ve sayfa kurallari ile birebir)
- Visual self-healing: screenshot -> Gemini QA -> CSS duzeltme -> rerender
- Editor iyilestirmeleri (shortcuts, autosave, restore)
- Frontmatter wizard (documentType, tone, layoutProfile, printProfile)
- Preview/convert tutarliligi (tek CSS kaynagi, ortak layout/print profilleri)

Kapsam disi:
- Markdown lint (Sprint 4)
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
- Preview, PDF ciktiyla yapisal olarak ayni kurallari kullanir.
- Visual self-healing en az 1 kez hatali sayfa kirilimini duzeltir.
- Frontmatter wizard verileri PDF meta ve layout ayarlarina yansir.
- Editor autosave geri yukleme akisi calisir.

## 4. Teknik Tasarim Ozeti

### 4.1 Preview Pipeline
- Paged.js polyfill ile browser preview render.
- Print CSS tek kaynak: `styles/print/*`.
- Preview ve export ayni layoutProfile/printProfile degiskenlerini kullanir.

### 4.2 Visual Self-Healing (AI QA)
- Render edilen sayfalarin screenshot'lari alinir.
- Gemini QA promptu ile layout hatalari (overflow, orphan/widow, overlap) tespit edilir.
- Tespit edilen sorunlar CSS class olarak uygulanir (avoid-break, force-break).
- Maksimum 2 iterasyon, sonra rapor kaydi.

### 4.3 Frontmatter Wizard
- Wizard adimlari: baslik, yazar, tarih, documentType, tone, layoutProfile, printProfile.
- Wizard ciktiyi backend `generateFrontmatter` ile markdown'a ekler.
- Wizard ayarlari dokuman meta alanlarina kaydedilir.

### 4.4 Editor UX Iyilestirmeleri
- Kisayol komutlari: save, preview, insert heading.
- Autosave interval + crash recovery.
- Editor/preview senkronizasyonu (debounce).

### 4.5 Ortam Degiskenleri (Minimum)
- API: `REDIS_URL`, `JOB_QUEUE_NAME`, `PORT`, `NODE_ENV`
- Rendering: `PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_SKIP_DOWNLOAD`
- AI: `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- FE: `VITE_API_URL`

## 5. Entegrasyon Akisi (Is Adimi)
1) Editor -> Preview (Paged.js)
2) Preview -> QA screenshot
3) Gemini QA -> CSS fix listesi
4) Preview rerender (limitli iterasyon)
5) Export -> /api/convert/to-pdf

## 6. Sprint Takvimi
- G1-G2: Paged.js preview polish
- G3-G5: Visual self-healing loop
- G6-G7: Frontmatter wizard
- G8-G9: Editor iyilestirmeleri
- G10: Test, demo ve kapanis

## 7. Sprint 3 Backlog (Issue-Based)

### ISSUE F2-S3-01: Paged.js Preview Polish
Labels: [RENDER] [FE]
Goal: Preview ile print kurallarini esitle.
Tasks:
- [ ] Preview CSS ve print CSS uyumlulugu
- [ ] Page numbering ve header/footer string-set
- [ ] LayoutProfile/PrintProfile birebir uygulama
Acceptance:
- [ ] Preview PDF ile uyumlu gorunur

### ISSUE F2-S3-02: Visual Self-Healing (AI QA)
Labels: [AI] [RENDER]
Goal: Screenshot tabanli layout hatasi tespiti ve duzeltme.
Tasks:
- [ ] Puppeteer screenshot pipeline
- [ ] Gemini QA prompt + JSON issue listesi
- [ ] CSS class map (avoid-break, force-break)
- [ ] Max 2 iterasyon, QA raporu kaydi
Acceptance:
- [ ] En az 1 senaryoda layout hatasi azalir

### ISSUE F2-S3-03: Editor Iyilestirmeleri
Labels: [FE] [UX]
Goal: Editor deneyimini iyilestir.
Tasks:
- [ ] Autosave + restore
- [ ] Kisayol komutlari
- [ ] Preview debounce ve stabilizasyon
Acceptance:
- [ ] Autosave kaybi olmadan geri yukleme calisir

### ISSUE F2-S3-04: Frontmatter Wizard
Labels: [FE] [CONTENT]
Goal: Dokuman metadatasi wizard ile yonetilsin.
Tasks:
- [ ] Wizard UI (documentType, tone, layout/print)
- [ ] Wizard -> backend settings mapping
- [ ] Wizard ayarlarini dokumana kaydet
Acceptance:
- [ ] Wizard verileri PDF frontmatter'ina yansir

### ISSUE F2-S3-05: Preview/Convert Tutarliligi
Labels: [RENDER] [API]
Goal: Preview ve export ayni pipeline kurallarini kullansin.
Tasks:
- [ ] Tek CSS kaynagi (print-base + profile)
- [ ] Ortak layoutProfile/printProfile seti
- [ ] Preview ve export tema uyumu
Acceptance:
- [ ] Preview/export farklari minimum

## 8. Ayrintili Task Breakdown

### F2-S3-01 Paged.js Preview Polish
Breakdown:
- [ ] Preview render CSS injection standardi
- [ ] Header/footer string-set uyumu
- [ ] Page margin ve bleed simetrisi
Notlar:
- Preview ve export ayni kurallari kullanmali.

### F2-S3-02 Visual Self-Healing (AI QA)
Breakdown:
- [ ] Screenshot format standardi (A4/A3)
- [ ] QA prompt sablonu ve JSON response contract
- [ ] CSS fix kurallari (avoid/force)
- [ ] Iterasyon limiti ve rapor kaydi
Notlar:
- QA raporu, sonraki sprint icin birikir.

### F2-S3-03 Editor Iyilestirmeleri
Breakdown:
- [ ] Autosave interval ve local cache
- [ ] Restore flow ve conflict handling
- [ ] Kisayol komut mapping
Notlar:
- Autosave network bagimli olmamali.

### F2-S3-04 Frontmatter Wizard
Breakdown:
- [ ] Wizard soru seti
- [ ] Wizard -> settings map
- [ ] Backend frontmatter injection
Notlar:
- Frontmatter schema Sprint 2 ile uyumlu olmali.

### F2-S3-05 Preview/Convert Tutarliligi
Breakdown:
- [ ] Preview pipeline icin tek layoutProfile seti
- [ ] printProfile secimi (pagedjs-a4/a3)
- [ ] Theme mapping (white, g10, g90, g100)
Notlar:
- FE ve worker arasinda version uyumu saglanmali.

## 9. Bagimliliklar
- F2-S3-02 -> F2-S3-01 tamamlanmadan baslamaz
- F2-S3-05 -> F2-S3-01 tamamlanmadan kapanmaz
- F2-S3-04 -> F2-S3-03 ile paralel gidebilir

## 10. Test ve Dogrulama
Minimum test senaryolari:
- Preview ile export PDF render karsilastirmasi
- Visual self-healing loop (1 iterasyon) dogrulama
- Autosave -> restore akisi
- Wizard -> frontmatter -> PDF kontrolu

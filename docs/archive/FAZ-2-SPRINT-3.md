# FAZ 2 - SPRINT 3 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md` ve `docs/IS-PLANI.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 3, editor/preview kalitesini artirir: PDF tabanli preview parity, PDF lint + visual self-healing (AI QA) ve frontmatter wizard.

## 1. Amac ve Kapsam
Sprint 3, Faz 2 baslangic adimi olarak preview ile PDF arasindaki farklari azaltir ve editor deneyimini guclendirir.

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
- Preview, export pipeline ile uretilen PDF'i iframe icinde gosterir.
- Print CSS tek kaynak: `styles/print/*`.
- Preview ve export ayni layoutProfile/printProfile degiskenlerini kullanir.
- Ileri asama: Paged.js polyfill ile HTML preview (opsiyonel).

### 4.2 Visual Self-Healing (AI QA)
- Render edilen sayfalarin screenshot'lari alinir.
- Gemini QA promptu ile layout hatalari (overflow, orphan/widow, overlap) tespit edilir.
- Tespit edilen sorunlar CSS class olarak uygulanir (avoid-break, force-break).
- Maksimum 2 iterasyon, sonra rapor kaydi.

### 4.2.1 Statik PDF Lint
- Overflow, widows/orphans, min font-size, contrast.
- Erisilebilirlik preflight: heading order, reading order, bookmarks, link ayiklama.

### 4.2.2 QA JSON Contract
- Gemini QA cikti sablonu tek formatta tutulur.
- Issue tipi: overflow, overlap, widow, orphan, table-split, contrast, font-size.
- Severity: low, medium, high (high ise zorunlu fix).

Ornek (ozet):
```
{
  "issues": [
    { "type": "widow", "severity": "medium", "page": 3, "selector": "p:nth-of-type(12)", "recommendation": "avoid-break" }
  ],
  "summary": "1 issue detected"
}
```

### 4.2.3 Fix Map (CSS Uygulama)
- widow/orphan -> ilgili paragraf grubuna `.avoid-break`
- overflow/overlap -> baslik veya blok oncesine `.force-break`
- table-split -> tabloya `.avoid-break`, gerekiyorsa once `.force-break`
- contrast/font-size -> lint raporu (otomatik fix yok)

### 4.2.4 QA Raporu Kaydi
- QA raporu `job_events` veya `job.result.qaReport` altinda saklanir.
- Rapor, issue listesi + iterasyon sayisi + uygulanan fix listesi icermeli.
- Screenshot yolu rapora eklenir (ornek: `output/jobs/<id>-qa.png`).

### 4.3 Frontmatter Wizard
- Wizard adimlari: baslik, yazar, tarih, documentType, tone, layoutProfile, printProfile.
- Wizard ciktiyi backend `generateFrontmatter` ile markdown'a ekler.
- Wizard ayarlari dokuman meta alanlarina kaydedilir.
- CarbonPress content schema alanlari (templateKey, locale, version) icin genisletilebilir.

Ornek frontmatter:
```
---
title: "Quarterly Report"
author: "Cureonics"
documentType: report
tone: formal
layoutProfile: symmetric
printProfile: pagedjs-a4
theme: white
---
```

### 4.4 Editor UX Iyilestirmeleri
- Kisayol komutlari: save, preview, insert heading.
- Autosave interval + crash recovery.
- Editor/preview senkronizasyonu (debounce).

Notlar:
- Autosave local storage veya indexed DB uzerinden tutulur.
- Son kayit tarih/saat bilgisi UI'da gorunur.

### 4.5 Ortam Degiskenleri (Minimum)
- API: `REDIS_URL`, `JOB_QUEUE_NAME`, `PORT`, `NODE_ENV`
- Rendering: `PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_SKIP_DOWNLOAD`
- AI: `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- QA: `PDF_QA_ENABLED`, `PDF_QA_MAX_ITERATIONS`, `PDF_QA_BOTTOM_GAP`, `PDF_QA_TOP_GAP`, `GEMINI_QA_MODEL`
- FE: `VITE_API_URL`

### 4.6 Kalite Kapilari (Minimum)
- Preview/export uyumsuzlugu: 0 kritik fark.
- QA loop: max 2 iterasyon, son rapor kaydi zorunlu.
- Lint: overflow/orphan/widow/contrast uyarilari raporlanir.
- Preflight gate: lint + QA fail ise publish edilmeyecek.

## 5. Entegrasyon Akisi (Is Adimi)
1) Editor -> PDF preview (convert job)
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
- [x] Preview CSS ve print CSS uyumlulugu (PDF iframe)
- [x] Page numbering ve header/footer string-set
- [x] LayoutProfile/PrintProfile birebir uygulama
- [x] Layout JSON component/grid preview mapping
Acceptance:
- [x] Preview PDF ile uyumlu gorunur

### ISSUE F2-S3-02: Visual Self-Healing (AI QA)
Labels: [AI] [RENDER]
Goal: Screenshot tabanli layout hatasi tespiti ve duzeltme.
Tasks:
- [x] Puppeteer screenshot pipeline
- [x] Gemini QA prompt + JSON issue listesi
- [x] QA JSON schema + severity kurallari
- [x] CSS class map (avoid-break, force-break)
- [x] Max 2 iterasyon, QA raporu kaydi
- [x] Statik PDF lint (overflow/min font/widow/orphan)
- [x] Accessibility preflight (heading/order/link)
Acceptance:
- [x] En az 1 senaryoda layout hatasi azalir

### ISSUE F2-S3-03: Editor Iyilestirmeleri
Labels: [FE] [UX]
Goal: Editor deneyimini iyilestir.
Tasks:
- [x] Autosave + restore
- [x] Kisayol komutlari
- [x] Preview debounce ve stabilizasyon
- [x] Autosave durum etiketi (son kayit zamani)
Acceptance:
- [x] Autosave kaybi olmadan geri yukleme calisir

### ISSUE F2-S3-04: Frontmatter Wizard
Labels: [FE] [CONTENT]
Goal: Dokuman metadatasi wizard ile yonetilsin.
Tasks:
- [x] Wizard UI (documentType, tone, layout/print)
- [x] Wizard -> backend settings mapping
- [x] Wizard ayarlarini dokumana kaydet
- [x] Frontmatter ornek ve schema dogrulama (templateKey, locale, version)
Acceptance:
- [x] Wizard verileri PDF frontmatter'ina yansir

### ISSUE F2-S3-05: Preview/Convert Tutarliligi
Labels: [RENDER] [API]
Goal: Preview ve export ayni pipeline kurallarini kullansin.
Tasks:
- [x] Tek CSS kaynagi (print-base + profile)
- [x] Ortak layoutProfile/printProfile seti
- [x] Preview ve export tema uyumu
- [x] Ortak HTML builder (layout grid + storytelling)
Acceptance:
- [x] Preview/export farklari minimum

## 8. Ayrintili Task Breakdown

### F2-S3-01 Paged.js Preview Polish
Breakdown:
- [x] Preview render CSS injection standardi (PDF iframe)
- [x] Header/footer string-set uyumu
- [x] Page margin ve bleed simetrisi
- [x] Layout grid preview mapping (layoutProfile + layoutJson)
Notlar:
- Preview ve export ayni kurallari kullanmali.

### F2-S3-02 Visual Self-Healing (AI QA)
Breakdown:
- [x] Screenshot format standardi (A4/A3)
- [x] QA prompt sablonu ve JSON response contract
- [x] QA schema (issue type + severity) ve validation
- [x] CSS fix kurallari (avoid/force)
- [x] Iterasyon limiti ve rapor kaydi
Notlar:
- QA raporu, sonraki sprint icin birikir.

### F2-S3-03 Editor Iyilestirmeleri
Breakdown:
- [x] Autosave interval ve local cache
- [x] Restore flow ve conflict handling
- [x] Kisayol komut mapping
- [x] Autosave status indicator
Notlar:
- Autosave network bagimli olmamali.

### F2-S3-04 Frontmatter Wizard
Breakdown:
- [x] Wizard soru seti
- [x] Wizard -> settings map
- [x] Backend frontmatter injection
- [x] Frontmatter schema ornekleri (templateKey, locale, version)
Notlar:
- Frontmatter schema Sprint 2 ile uyumlu olmali.

### F2-S3-05 Preview/Convert Tutarliligi
Breakdown:
- [x] Preview pipeline icin tek layoutProfile seti
- [x] printProfile secimi (pagedjs-a4/a3)
- [x] Theme mapping (white, g10, g90, g100)
- [x] Ortak HTML builder fonksiyonu
Notlar:
- FE ve worker arasinda version uyumu saglanmali.

## 9. Bagimliliklar
- F2-S3-02 -> F2-S3-01 tamamlanmadan baslamaz
- F2-S3-05 -> F2-S3-01 tamamlanmadan kapanmaz
- F2-S3-04 -> F2-S3-03 ile paralel gidebilir

## 10. Test ve Dogrulama
Minimum test senaryolari:
- [x] Preview ile export PDF render karsilastirmasi
- [x] Visual self-healing loop (1 iterasyon) dogrulama
- [x] Autosave -> restore akisi
- [x] Wizard -> frontmatter -> PDF kontrolu

## 11. Cikti Artefaktlari
- Preview pipeline parity checklist
- QA prompt seti + JSON schema dokumani
- QA raporu ornek kaydi (1 islem)
- Wizard alan haritasi ve frontmatter ornekleri
- Autosave/restore UX notlari

## 12. Riskler ve Onlemler
- Screenshot QA gecikmesi -> iterasyon limiti ve timeout
- Gemini QA cikisi tutarsiz -> schema validation + fallback
- Preview/export uyumsuzlugu -> tek CSS ve ortak HTML builder

## 13. CarbonPress Uyum Notu
- Frontmatter wizard, Press Pack content schema ile uyumlu hale getirilecek.
- QA raporu release manifest icin girdi olarak saklanacak.

## 14. Guncel Durum Profili
- Sprint 3 backlog'u tamamlandi; autosave + wizard akislari kapandi.

## 15. Sonraki Adimlar
- Sprint 6 kapsamindaki Press Pack manifest + editorial/publish backlog'una gec.
- Release pipeline icin preflight gate ve output manifest baglantisini tamamlama.

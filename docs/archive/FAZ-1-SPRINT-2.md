# FAZ 1 - SPRINT 2 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ve `docs/SPRINT-0-DELIVERABLES.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 2, Paged.js tabanli baski motorunu ve Gemini 3 Pro art director katmanini devreye alir:
print CSS kurallari, dinamik grid/layout JSON uretimi, data storytelling ve storage signed URL akisi.

## 1. Amac ve Kapsam
Sprint 2, HTML/React uzerinden matbaa kalitesinde PDF ureten mimariyi aktif eder:
- Paged.js ile print CSS kurallari ve sayfalandirma
- Gemini 3 Pro art director modulunun layout/insight JSON uretimi
- Data storytelling (callout/insight metinleri)
- Logic-based styling (break-before/avoid-break kurallari)
- Storage path standardi + signed URL download akisi

Kapsam dahili:
- print.css ve @page kurallari (A4/A3, bleed, marks, left/right)
- Gemini 3 Pro promptlari ve JSON response contract
- Carbon Grid tabanli dinamik layout props (lg/md) uretimi
- AI insight kutulari (executive summary, key insight)
- Job result metadata: layoutJson, printProfile, signedUrl
- Supabase storage path standardi + signed URL

Kapsam disi:
- Visual self-healing (Sprint 3)
- Template registry ve token mapping (Sprint 5-6)
- Billing/usage limitleri (Sprint 7-8)

## 2. Sprint 0 Kararlari (Uygulanan)
- Deploy: Docker tabanli Express API + Worker
- Queue: Redis + BullMQ
- Auth: Supabase JWT (Authorization: Bearer)
- Rendering: React + Carbon Components
- Baski/PDF: Paged.js (print CSS + sayfalandirma)
- AI provider: Gemini 3 Pro (preview) + 2.5 Pro fallback (server-side proxy)
- API base URL: VITE_API_URL
- Error format ve logging standardi (request_id + job_id)

## 3. Cikti ve Basari Kriterleri (Exit)
- Paged.js ile PDF uretimi stabil calisir.
- print.css kurallari (A4, bleed, crop/cross marks, left/right) aktif.
- Gemini 3 Pro art director layout JSON uretir ve renderer uygular.
- Data storytelling kutulari olusur ve PDF'e yansir.
- Storage path standardi + signed URL download calisir.

## 4. Teknik Tasarim Ozeti

### 4.1 API Yuzeyi (Sprint 2)
- POST `/api/convert/to-pdf` -> job create + art director + render
- GET `/api/jobs/{id}` -> status + layout metadata + signed URL
- GET `/api/jobs/{id}/download` -> signed URL veya redirect

Error payload:
```
{ error: { code, message, details, request_id } }
```

### 4.2 Paged.js Print CSS
- @page: size, margin, bleed, marks, header/footer string setleri
- Spread logic: :left / :right cilt payi
- Akilli kirilmalar: .avoid-break, .force-break

### 4.3 Gemini 3 Pro Art Director
- Girdi: markdown + metadata + data blocks
- Cikti: layout JSON (grid system, component listesi, layoutProps)
- Ek: executive summary + key insight metinleri
- Not: Gemini 3 Pro (preview) varsayilan, JSON cikmazsa 2.5 Pro fallback.
- Oneri: DocumentPlan (semantik) + LayoutPlan (uzamsal) iki asamali ciktı.

Ornek JSON (ozet):
```
{
  "gridSystem": "asymmetric",
  "components": [
    { "type": "CarbonChart", "layoutProps": { "colSpan": 10 } }
  ],
  "storytelling": { "executiveSummary": "..." }
}
```

### 4.4 Data Storytelling
- Ham veri analizi (outlier/trend tespiti)
- CEO seviyesi ozet (callout box)
- Grafik altina kisa insight metni

### 4.5 Logic-Based Styling
- Icerik akisina gore CSS kurali yazimi
- Table/page break kararlarinda break-before/avoid-break
- Sol sayfa basligi sag sayfaya itme (force blank page)

### 4.6 Storage Path Standardi
- Inputs: `documents/{user_id}/{document_id}/original.*`
- Markdown: `documents/{user_id}/{document_id}/markdown.md`
- Outputs: `pdfs/{user_id}/{document_id}/{job_id}.pdf`

### 4.7 Ortam Degiskenleri (Minimum)
- API: `REDIS_URL`, `JOB_QUEUE_NAME`, `PORT`, `NODE_ENV`
- Rendering: `CHROMIUM_PATH` (opsiyonel), `PRINT_CSS_PATH` (opsiyonel), `PUPPETEER_EXECUTABLE_PATH` (ARM/CI), `PUPPETEER_SKIP_DOWNLOAD=1`
- Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_DOCUMENTS`, `SUPABASE_BUCKET_PDFS`
- AI: `GEMINI_API_KEY` (veya `GOOGLE_API_KEY`), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`
- FE: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## 5. Entegrasyon Akisi (Is Adimi)
1) FE -> POST `/api/convert/to-pdf`
2) API -> Gemini 3 Pro art director (layout JSON + insight)
3) Renderer -> React + Carbon ile HTML render
4) Paged.js -> PDF uretimi
5) Storage upload -> signed URL
6) FE -> download/preview

## 6. Sprint Takvimi
- G1-G2: Paged.js print.css kurallari
- G3-G5: Gemini 3 Pro art director + layout JSON
- G6-G7: Data storytelling + logic-based styling
- G8-G9: Storage upload + signed URL
- G10: Test, demo ve kapanis

## 7. Sprint 2 Backlog (Issue-Based)

### ISSUE F1-S2-01: Paged.js Print Pipeline
Labels: [RENDER]
Goal: Paged.js ile PDF uretimi aktif.
Tasks:
- [x] print.css ve @page kurallari
- [x] left/right sayfa kurallari
- [x] break classlari (avoid/force)
Acceptance:
- [x] PDF uretimi stabil ve kurallar uygulanir

### ISSUE F1-S2-02: Gemini 3 Pro Art Director
Labels: [AI] [LAYOUT]
Goal: Layout JSON ve storytelling uretimi.
Tasks:
- [x] Prompt seti ve JSON contract
- [x] JSON normalization + fallback (bos cikista fallback JSON)
- [x] Carbon Grid prop uretimi + renderer mapping
- [x] Executive summary + key insight
Acceptance:
- [x] Storytelling + styleHints ciktisi HTML/PDF'e yansir
- [x] Layout JSON komponent/grid yerlesimi renderer tarafinda uygulanir

### ISSUE F1-S2-03: Data Storytelling
Labels: [AI] [CONTENT]
Goal: Grafik altina insight ve ozet metinleri.
Tasks:
- [x] Outlier/trend tespiti (fallback heuristik + prompt)
- [x] Callout box metinleri
- [x] Veri ozeti ton standardi (prompt)
Acceptance:
- [x] Insight kutulari PDF'te gorunur

### ISSUE F1-S2-04: Logic-Based Styling
Labels: [RENDER] [CSS]
Goal: Icerik akisina gore akilli CSS.
Tasks:
- [x] Tablo sayfa sonu kurali
- [x] Baslik/sayfa offset kurali (break-after: avoid)
- [x] Break-before/avoid-break mapping
Acceptance:
- [x] Orphan/widow senaryolari azalir (orphans/widows CSS)

### ISSUE F1-S2-05: Storage + Signed URL
Labels: [STORAGE]
Goal: PDF storage path + signed URL.
Tasks:
- [x] Storage path standardi
- [x] Signed URL TTL ve download endpointi
- [x] Job result metadata (signedUrl, expiresAt)
Acceptance:
- [x] Download akisi signed URL ile calisir

### ISSUE F1-S2-06: Frontend Download Entegrasyonu
Labels: [FE]
Goal: FE signed URL ile download/preview.
Tasks:
- [x] Job polling sonucu signedUrl kullanimi
- [x] Download butonu (signedUrl veya /download)
- [x] Download hata mesaji (toast/alert)
- [x] Retry/refresh signed URL
Acceptance:
- [x] Normal signedUrl akisi ile download calisir
- [x] Expired signedUrl icin FE retry/refresh tamamlanir

## 8. Ayrintili Task Breakdown

### F1-S2-01 Paged.js Print Pipeline
Breakdown:
- [x] print.css @page kurallari (A4/A3, bleed, marks)
- [x] left/right page margin (cilt payi)
- [x] force-break ve avoid-break siniflari
Notlar:
- Print CSS tek kaynak olmali.

### F1-S2-02 Gemini 3 Pro Art Director
Breakdown:
- [x] Prompt tasarimi (layout + insight)
- [x] JSON normalization + fallback
- [x] JSON schema (zod/ajv) + validation
- [x] Carbon Grid mapping (lg/md) + component placement
Notlar:
- Layout JSON versiyonlanmali.

### F1-S2-03 Data Storytelling
Breakdown:
- [x] Veri analizi kurallari (outlier/trend)
- [x] Insight metinleri icin ton/format standardi
- [x] Callout bilesenleri
Notlar:
- Metinler CEO seviyesi sade dilde olmali.

### F1-S2-04 Logic-Based Styling
Breakdown:
- [x] Tablo/section page break heuristikleri
- [x] Basliklar icin sayfa baslatma kurali (break-after: avoid)
- [x] AI tarafindan dinamik class ekleme
Notlar:
- Kurallar deterministic olmali.

### F1-S2-05 Storage + Signed URL
Breakdown:
- [x] Bucket isimleri (documents, pdfs) ve path kalibi
- [x] Signed URL TTL konfigurasyonu
- [x] Job result metadata kaydi
Notlar:
- Storage path standardi dokumantasyonda tek kaynak olmali.

### F1-S2-06 Frontend Download Entegrasyonu
Breakdown:
- [x] Job polling sonucu signedUrl kullan
- [x] Download/preview button UX
- [x] Hata ve retry mesajlari (expired signedUrl)
Notlar:
- Preview polish Sprint 3 kapsaminda.

## 9. Bagimliliklar
- F1-S2-02 -> F1-S2-01 tamamlanmadan baslamaz
- F1-S2-04 -> F1-S2-02 layout JSON olmadan tamamlanamaz
- F1-S2-06 -> F1-S2-05 tamamlanmadan test edilemez

## 10. Test ve Dogrulama
Minimum test senaryolari:
- [x] /api/convert/to-pdf -> Paged.js PDF uretimi (smoke test)
- [x] Layout JSON -> renderer uygulama (component grid)
- [x] Insight kutusu -> PDF'te gorunur (smoke test)
- [x] /api/jobs/{id}/download -> signed URL redirect
- [x] FE download akisi (expired signedUrl retry/refresh)

## 11. CarbonPress Uyum Notu
- layoutProfile/printProfile alanlari Press Pack icindeki profillerle birebir eslestirilir.
- QA/preflight kurallari logic-based styling contract'i ile hizalanir.

## 12. Guncel Durum Profili
- Sprint 2 backlog'u tamamlandi; Paged.js + Gemini art director + signed URL akisi calisiyor.

## 13. Sonraki Adimlar
- Sprint 3: preview parity + visual self-healing + frontmatter wizard.
- Press Pack manifest ve content schema alanlari frontmatter wizard ile standartlastirilacak.

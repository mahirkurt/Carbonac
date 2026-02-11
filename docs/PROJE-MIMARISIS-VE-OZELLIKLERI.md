# PROJE MİMARİSİ VE ÖZELLİKLERİ (Nihai Konsolide)

> **SoT Önceliği:** `docs/PROJE-TALIMATLARI.md` > `docs/SPRINT-0-DELIVERABLES.md` > `docs/IS-PLANI.md` > diğerleri.
> **Amaç:** Carbonac’ın güncel mimarisini, tamamlanan yeteneklerini ve platform karakteristiğini tek bir nihai dokümanda, tutarlı ve bütüncül biçimde özetlemek.

---

## 1) Proje Özeti (Kısa)
Carbonac; IBM Carbon Design System temelli React arayüzü, Paged.js baskı motoru ve Gemini 3 Pro (fallback 2.5 Pro) destekli AI art director ile markdown/PDF üreten, job/queue/worker mimarisiyle ölçeklenen bir raporlama platformudur. Ürün odağı **platform + editör + template registry + kalite zinciri** bileşimidir.

**Kapsam dahil:** API/worker altyapısı, conversion pipeline, template sistemi ve token mapping, web UI (editor/preview/wizard), AI servis katmanı, storage yaşam döngüsü, observability ve güvenlik.  
**Kapsam dışı (opsiyonel):** Kurumsal SSO/SCIM, on‑prem enterprise kurulum, tam aktif/aktif multi‑region.

**Başlıca hedefler:**
- Markdown → PDF akışını yüksek doğrulukla (>= %98 başarı) üretmek
- Kullanıcıya deterministik ve tekrar üretilebilir çıktı (press pack + preflight) sağlamak
- AI destekli kalite zinciri ile self‑healing ve layout iyileştirmesi
- Kurumsal rapor standardında tipografi, grid ve token uyumu

---

## 2) SoT Mimari Kararlar (Bağlayıcı)
- **Deploy modeli:** Docker tabanlı Express API + Worker servisleri
- **Queue:** Redis + BullMQ
- **Auth:** Supabase JWT (Authorization: Bearer)
- **Rendering motoru:** React + Carbon Components (tek kaynak görünüm)
- **PDF/Baskı:** Paged.js (print CSS + sayfalandırma)
- **Storage:** Supabase buckets, standart path
- **AI provider:** Gemini 3 Pro (preview) + 2.5 Pro fallback (server-side proxy)
- **Logging:** request_id + job_id zorunlu
- **Kalite zinciri:** statik PDF lint + Gemini QA (self‑healing)
- **Press Pack:** template + tokens + patterns + QA rules + sample content (preflight gate zorunlu)
- **Publish:** preflight pass zorunlu; opsiyonel kalite checklist enforcement `PUBLISH_REQUIRE_QUALITY_CHECKLIST=true`
- **API standardı:** unified error payload (code, message, details, request_id)

**SoT uyumu notları:**
- Çelişkide `docs/PROJE-TALIMATLARI.md` geçerlidir.
- Tasarım/UX kararları bu dokümandaki özet ile çelişiyorsa SoT revize edilmelidir.

---

## 3) Sistem Bileşenleri ve Sorumlulukları

### 3.1 API Servisi
- `/api/convert/to-pdf`, `/api/jobs/:id`, `/api/jobs/:id/download`
- Job lifecycle yönetimi, signed URL üretimi
- Press Pack / template metadata / release output manifest
- Preflight gate ve job_events loglama
- AI proxy endpointleri: `/api/ai/analyze`, `/api/ai/ask`
- Rate limit + audit log + request_id zorunluluğu

### 3.2 Worker Servisi
- Markdown parse + directive/pattern mapping
- AI art director (DocumentPlan + LayoutPlan)
- Paged.js print pipeline + PDF export + postprocess
- Storage upload + signed URL
- QA aşamaları: lint → a11y → typography scoring → visual regression
- Output manifest oluşturma (template/version/tokens hash)

### 3.3 Frontend (UI)
- Editor + frontmatter wizard + autosave
- Template gallery + governance aksiyonları
- Job status/polling + download akışı
- QA panel (lint/a11y/typography uyarıları + jump‑to‑source)
- Directive palette / component inserter

### 3.4 AI Art Director
- DocumentPlan (semantik) + LayoutPlan (uzamsal)
- Storytelling: Executive Summary, Key Insights, Survey Methodology/Sources
- Prompt versioning + rollback
- Input limit + PII redaction + güvenli proxy

### 3.5 Templates / Press Pack / Patterns
- Template registry + versioning + approval
- Press Pack manifest (template + tokens + patterns + QA rules + sample content)
- Pattern katalogu: `patterns/registry.json` ve `patterns/schemas/*`
- Template governance: draft → review → approved → published
- Template preview: PNG thumbnail üretimi

### 3.6 QA / Preflight
- Typography + a11y + visual regression + lint
- Output manifest ve QA raporları
- Quality checklist (EK‑GELISTIRME maddeleri) preflight raporuna bağlı

### 3.7 CLI
- `carbonac build` ve `carbonac qa` komutları
- Multi‑output (PDF + HTML + PNG preview) ve build cache
- Parallel build (worker concurrency) ve hash tabanlı cache

---

## 4) End‑to‑End Veri Akışı (Özet)
1. Markdown + frontmatter alınır
2. AI art director → layout instruction (layoutProfile/printProfile + components)
3. HTML render + print CSS (Paged.js)
4. PDF export + postprocess (metadata + QA)
5. Storage upload + signed URL
6. Job polling + download

**Job state modeli:** queued → processing → completed/failed/cancelled; retry max 3, exponential backoff.

---

## 5) Güncel Durum Profili (Snapshot)
**Tamamlanan ana yetenekler:**
- Core pipeline (API → queue → worker → download) çalışır.
- Paged.js print CSS aktif; preview gerçek PDF görünümünde.
- Gemini art director (3 Pro + 2.5 Pro fallback) entegre.
- Press Pack + release/publish + governance UI hazır.
- Preflight gate + QA raporu + job_events loglama aktif.
- Template registry + versioning + preview gallery tamam.
- Raspberry Pi Docker deploy ve uzaktan çalışma doğrulandı.
- CI/DoD enforcement, artifact upload, version stamping ve QA/smoke otomasyonları aktif.

**Kalan kritik backlog:** yok (Faz 4 epics tamamlandı). Opsiyonel: alert eşiklerini ortam KPI’larına göre kalibre et.

**KPI hedefleri (SoT/IS‑PLANI):**
- Conversion başarı oranı >= 98%
- p95 convert time: 10 sayfa < 30s, 50 sayfa < 120s
- p95 queue wait < 10s (normal yük)
- API availability >= 99.5%, error rate < 1%
- Carbon Adherence Score >= 85, Layout Health Score >= 90, Readability Score >= 80

**Faz/Sprint özeti:**
- Faz 0 (Sprint 0): kararlar, API contract, job state, DB schema (tamam)
- Faz 1 (Sprint 1‑2): core pipeline + Paged.js + Gemini art director (tamam)
- Faz 2 (Sprint 3‑4): preview, QA, autosave, frontmatter wizard (tamam)
- Faz 3 (Sprint 5‑6): template registry, press pack, governance, release/publish (tamam)
- Faz 4 (Sprint 7‑8): observability, release gating, DoD enforcement (tamam)

---

## 6) Mimari ve Tasarım Standartları (Kritik Özet)
- **Carbon v11** temel alınır.
- **Print token pack**: `tokens/print.json` (baseline grid, safe-area, caption/footnote, chart spacing)
- **PDF guardrails:** A4 varsayılan, margin 20mm, bleed 3mm, header/footer string setleri, akıllı page-break kuralları
- **Erişilebilirlik:** heading hiyerarşisi, okuma sırası, bookmark/link/kontrast kontrolleri
- **Output manifest:** template/version/tokens hash + preflight sonucu

**Typografi / tasarım prensipleri (kısa):**
- IBM Plex aileleri (Sans/Serif/Mono/Condensed), Carbon v11 type scale
- Line‑height: tight 1.125 / default 1.5 / loose 1.75
- Data‑viz standardı: caption + source + sample size + key insight

**Print CSS guardrails (özet):**
- A4 varsayılan, margin 20mm, bleed 3mm, crop/cross marks aktif
- Running header/footer (string‑set + margin box) ve mini‑TOC opsiyonel
- Link URL’leri print’te görünür; interaktif UI öğeleri gizlenir
- CMYK güvenli renkler: blue‑80, gray‑100, red‑70, green‑70
- Font embedding zorunlu; print body 10pt, heading 14pt

---

## 7) CarbonPress’ten Entegre Edilen/Edilecek Net Katkılar
Bu bölüm, `docs/EK-GELISTIRME-ONERILERI.md` analizine göre SoT ile çelişmeyen en yüksek değerli katkıları yansıtır:
- **AST pipeline (unified/remark/rehype)** ile deterministik içerik işleme
- **Directive DSL** ile explicit component çağırımı
- **Typography/micro‑typography** iyileştirmeleri
- **QA otomasyonu** (axe-core, typography scoring, visual regression) → AI self‑healing için ön kapı
- **Paged.js + headless Chromium + pdf-lib** hibrit render yaklaşımı

**Not:** React + Carbon “tek kaynak görünüm” ilkesini bozacak Nunjucks tabanlı ikinci render yolu **kullanılmaz**.

**Ek kazanımlar (özet):**
- Directive DSL + component catalog birleşimi
- Typography scoring + visual regression ile deterministik QA
- Headless export ayarları (preferCSSPageSize, printBackground, displayHeaderFooter)

---

## 8) Operasyon ve DevOps Özeti
- Docker Compose profilleri (api/worker) ve Raspberry runbook
- CI: QA/Smoke + DoD enforcement + artifact upload
- Metrics dashboard + alert eşikleri + runbook prosedürleri
- Version stamping (PDF metadata), RUN_QA/RUN_SMOKE otomasyonları
- Pi deploy + smoke (pi_bridge) ve cloudflared/tailscale bağlantı modu

---

## 9) Güvenlik ve Uyumluluk (Özet)
- Authorization: Bearer token zorunlu
- Supabase RLS policy + bucket erişim izolasyonu
- Secrets sadece server‑side, rate limit + audit log
- Storage lifecycle + data retention kuralları
- File validation: mime/type/size

---

## 10) Sonraki Adımlar (Opsiyonel)
- Alert eşiklerini ortam KPI’larına göre kalibre et

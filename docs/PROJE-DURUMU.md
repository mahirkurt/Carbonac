# PROJE DURUMU (GUNCEL)

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ile uyumlu olmalidir. Cakisma varsa SoT gecerlidir.

## 1. Kisa Ozet
- Core pipeline (API -> queue -> worker -> download) calisir; Paged.js print CSS aktif.
- Gemini 3 Pro + 2.5 Pro fallback ile art director pipeline entegre.
- Press Pack + release/publish API kodda tamam; Supabase migrations 004/005 uygulandi.
- Pi uzerinde Docker api/worker/redis calisir ve uzaktan erisim (tunnel) dogrulandi.

## 2. Yapilanlar (Ozet)

### Backend ve API
- `/api/convert/to-pdf` ve job lifecycle endpointleri calisir.
- Signed URL refresh/redirect mantigi aktif.
- Press Pack schema validation, release metadata ve publish akisi kodlandi.
- Preflight gate: lint + QA raporu + job_events loglama entegre.
- EK-GELISTIRME kalite checklist'i preflight sonucuna baglandi.
- Template governance (state + approval) API tarafinda mevcut.
- Template rollback endpointi ve politika dogrulamasi aktif.

### Worker ve Rendering
- Paged.js tabanli render ve print CSS katmani aktif.
- LayoutProfile/PrintProfile frontmatter injection calisir.
- Output manifest olusturma ve artifact listesi uretilir.
- Storage path ve signed URL akisi worker tarafinda desteklenir.
- AI layout (art director) ve block whitelist dogrulama entegre.

### Frontend
- Template gallery + governance panel UI eklendi.
- Template version state guncelleme aksiyonlari mevcut.
- Markdown lint temel kurallari eklendi.
- Editor autosave + frontmatter wizard (content schema uyumlu) eklendi.
- Preview ve download akisi API ile uyumlu.

### Infra ve Deploy
- Raspberry Pi icin docker-compose.raspberry.yml ile api/worker/redis calisir.
- Worker container ARM Chromium ile paketlendi.
- Pi uzaktan yonetim icin `scripts/raspberry/pi_bridge.py` akisi mevcut.
- Supabase MCP ve migration dosyalari repo icinde hazir.
- CI workflow (unit + integration, QA/smoke, DoD check) eklendi.
- Metrics dashboard + alert esikleri (p95/error rate/queue depth) aktif.

## 3. Bekleyenler (Oncelik)
- Kritik backlog yok (Faz 4 epics tamam).

## 4. Riskler ve Bagimliliklar
- Alert esiklerinin ortam bazli ayarlanmasi gerekebilir.

## 5. Sonraki Adimlar (2 Hafta)
- Opsiyonel: alert esiklerini ortam KPI'larina gore kalibre et.

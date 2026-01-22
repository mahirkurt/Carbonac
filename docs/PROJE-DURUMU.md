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
- Template governance (state + approval) API tarafinda mevcut.

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
- CI workflow (unit + integration, opsiyonel QA/smoke) eklendi.

## 3. Bekleyenler (Oncelik)
- QA harness ve smoke testlerinin CI'da rutin calistirilmasi (RUN_QA/RUN_SMOKE) planlanmali.

## 4. Riskler ve Bagimliliklar
- Editor wizard/autosave eksigi, content schema standardizasyonunu geciktiriyor.
- Otomatik QA harness yoksa visual regressions artis riski.
- CI testleri yoksa degisikliklerin geri donusu zorlasir.

## 5. Sonraki Adimlar (2 Hafta)
- Frontmatter wizard + autosave tasklari kapatilacak.
- QA harness + test otomasyonu (unit + integration + smoke) kurulacak.

# FAZ 0 - SPRINT 0 DETAYLI PLAN

> Bu dokuman `docs/PROJE-TALIMATLARI.md` ve `docs/SPRINT-0-DELIVERABLES.md` ile uyumlu olmak zorundadir.

## 1. Amac ve Kapsam
**Status:** Completed. Referans: `docs/SPRINT-0-DELIVERABLES.md`.

Sprint 0, urun gelistirme oncesi temel hizalamayi ve mimari kararlarini netlestirmek icindir.
Bu sprintte ozellikle API hedefi, conversion pipeline, deploy modeli, guvenlik/anahtar yonetimi,
ve ortak backlog yapisi kesinlestirilir.

Kapsam dahili:
- Mimari kararlar (API, worker, storage, auth)
- Teknik borc ve risk tespiti
- API sozlesmesi taslagi
- Supabase veri modeli ve migration planlari
- Frontend servis katmani refaktor planlama
- AI servisinin server tarafina tasinmasi icin yol haritasi
- PoC ve minimun ispat (job tablosu, job status)

Kapsam disi:
- Tam conversion queue implementasyonu
- Template registry implementasyonu
- Paged.js preview/print entegrasyonu
- Billing altyapisi

## 2. Basari Kriterleri
- Mimari karar dokumani onaylanir.
- API contract taslagi hazirlanir.
- Job modeli ve status akisi tasarlanir.
- Supabase migration plani net (tablo, alan, index, policy listesi).
- Frontend servis refaktor plani yazilir.
- Risk ve guvenlik notlari kayda girer.

## 3. Sprint Sure ve Takvim
- Sure: 2 hafta (10 is gunu)
- G1-G2: Analiz + kararlar
- G3-G5: Tasarim dokumanlari + PoC
- G6-G8: Plan ve backlog son hali
- G9-G10: Demo + retro + kabul

## 4. Calisma Akislari ve Gorevler

### 4.1 API/Backend
Ama: Tek API ve is modeli tasarimini netlestirmek.

Gorevler:
- API base URL ve auth modeli karari
- Endpoint listesi taslagi:
  - POST /api/convert/to-markdown
  - POST /api/convert/to-pdf
  - POST /api/jobs
  - GET /api/jobs/{id}
  - GET /api/health
- Request/response schema taslaklari
- Hata sozlesmesi (error code, message, detail)
- Conversion is modeli (job state machine)
- PoC: /api/jobs create + GET status (mock)

Cikti:
- API Contract Taslagi (dokuman)
- Job State Diagram (metin tabanli)
- PoC notlari

### 4.2 Frontend UX
Ama: Frontend servis katmaninin hedef API ile hizalanmasi.

Gorevler:
- documentService hangi endpointleri cagiriyor haritalama
- Netlify functions bagimliligi tespiti
- Yeni API ile adapter/bridge planlama
- UI is akisi (Upload -> Processing -> Wizard -> Preview) risk analizi
- Preview gercek PDF hedefi icin gereksinimler

Cikti:
- FE Service Refactor Plan
- UI Flow Risk List

### 4.3 Template ve Tasarim Sistemi
Ama: Template seciminin end-to-end calismasi icin plan.

Gorevler:
- template secimi UI -> backend -> converter hizasi
- template isim standardi (carbon-advanced, carbon-template)
- token mapping gereksinimleri (typografi, renk, spacing)
- print token pack taslagi (baseline, safe-area, caption/footnote)
- pattern library taslagi (ExecutiveSummary, SurveyChartPage, WhatToDo)
- Press Pack manifest taslagi (template + tokens + patterns + QA rules)
- content schema taslagi (docType, templateKey, layoutProfile, printProfile, theme)
- template registry MVP ihtiyac listesi

Cikti:
- Template Strategy Notu
- Token Mapping Taslak
- Print Token Pack Taslak
- Pattern Library Taslak
- Press Pack Manifest Taslak

### 4.4 AI Danisman
Ama: AI anahtari ve cagrilarin server tarafinda yonetilmesi.

Gorevler:
- AI servisi icin backend endpoint taslagi
- Rate limit ve loglama gereksinimi
- Prompt dosyalari ve ref dokuman boyutu limiti
- Gizli anahtarlarin .env ve server configte tutulmasi

Cikti:
- AI Servis Taslak Plani

### 4.5 Data/Supabase
Ama: job modeli, conversion status ve log tutma tablolari.

Gorevler:
- jobs tablosu tasarimi (id, user_id, type, status, payload, result, error, created_at)
- job_events tablosu (job_id, status, message, timestamp)
- indexes ve RLS politikasi taslagi
- migration dosyasi taslak plan

Cikti:
- DB Taslak (SQL veya schema notu)

### 4.6 Infra/DevOps
Ama: Deploy modelini netlestirmek.

Gorevler:
- Express + worker mi, serverless mi? karar
- Paged.js/headless chromium/marker runtime kurulum modeli
- Local dev runbook taslagi
- CI pipeline ihtiyac listesi

Cikti:
- Deploy Karar Dokumani
- Runtime Bagimliliklari Listesi

### 4.7 QA/Observability
Ama: Minimum test ve loglama standartlari.

Gorevler:
- Minimum senaryo test listesi
- Log format (request id, job id, error code)
- Metric listesi (latency, success rate, file size)
- PDF lint checklist taslagi (overflow, widows/orphans, min font)
- PDF erisilebilirlik preflight listesi (heading, reading order, link)
- Kalite metrikleri (Carbon Adherence, Layout Health, Readability)
- Preflight gate prensipleri (lint + AI QA fail ise publish yok)

Cikti:
- Test Checklist
- Observability Baslangic Notu

### 4.8 Dokumantasyon
Ama: Her karar ve planin kaydi.

Gorevler:
- PROJE-TALIMATLARI.md uyum kontrolu
- IS-PLANI.md ile hizalama
- Sprint 0 summary dokumani

Cikti:
- Sprint 0 Summary

## 5. Karar Noktalari (Sprint 0'da Dogrulanan)
- API hosting modeli: Express API + Worker.
- Conversion queue: Redis + BullMQ.
- Storage: Supabase bucket path standardi.
- AI saglayici: Gemini 3 Pro (preview) + 2.5 Pro fallback (server-side).
- Preview motoru: Paged.js.

Referans: `docs/SPRINT-0-DELIVERABLES.md`.

## 6. Artefaktlar (Cikti Listesi)
- Mimari Karar Dokumani
- API Contract Taslagi
- Job State Diagram
- FE Service Refactor Plan
- Template Strategy Notu
- AI Servis Taslak Plani
- DB Taslak (SQL notu)
- Deploy Karar Dokumani
- Test Checklist
- Sprint 0 Summary

## 6.0 Sprint 0 Outputs (Applied)
- Tum Sprint 0 karar ve taslaklari tek dokumanda toplandi: `SPRINT-0-DELIVERABLES.md`

## 6.1 Sprint 0 Backlog (Issue-Based Tasklists)

### ISSUE S0-01: Mimari Karar ve Deploy Modeli
Labels: [ARCH] [OPS]
Goal: Tek API hedefi, worker modeli ve deploy stratejisi netlestirilsin.
Tasks:
- [x] Mevcut calisan servisleri ve bagimliliklari listele (backend, frontend, CLI).
- [x] Express + worker vs serverless karsilastirma notu yaz.
- [x] Paged.js/headless chromium/marker runtime gereksinimlerini belirle.
- [x] API base URL ve auth modeli (token/session) karari al.
- [x] Local dev runbook taslagi yaz.
Acceptance:
- [x] Deploy karar dokumani tamam.
- [x] Runtime bagimliliklari listesi tamam.

### ISSUE S0-02: API Contract Taslagi
Labels: [API] [DOCS]
Goal: Endpoint, payload ve hata sozlesmesi net olsun.
Tasks:
- [x] Endpoint listesi ve amaclari yaz (convert, jobs, health).
- [x] Request/response schema taslaklari cikar.
- [x] Hata formatini standartlastir (code, message, details, request_id).
- [x] Ornek curl ve JSON paylas.
Acceptance:
- [x] API contract taslagi paylasildi.

### ISSUE S0-03: Job State Modeli + PoC
Labels: [API] [DB]
Goal: Job state machine ve basic PoC hazir.
Tasks:
- [x] Job state listesi ve gecisleri tanimla.
- [x] Job tipleri (convert-md, convert-pdf, ai-analysis) belirle.
- [x] PoC: /api/jobs create ve /api/jobs/{id} read (mock).
- [x] Loglarda job_id kullanimi standartlari.
Acceptance:
- [x] Job state diagram mevcut.
- [x] PoC endpointler calisiyor (mock).

### ISSUE S0-04: Frontend Servis Haritasi ve Gecis Plani
Labels: [FE] [API]
Goal: Frontend yeni API ile uyumlu planlansin.
Tasks:
- [x] documentService endpoint kullanimi haritalama.
- [x] Netlify functions bagimlilik listesi.
- [x] Yeni API adapter/bridge taslagi.
- [x] UI flow risk analizi (Upload -> Processing -> Wizard -> Preview).
Acceptance:
- [x] FE service refactor plan dokumani tamam.

### ISSUE S0-05: Template Strategy ve Naming Standardi
Labels: [TEMPLATE]
Goal: Template secimi UI->backend->converter hizali olsun.
Tasks:
- [x] Template isim standardi listesi (carbon-advanced, carbon-template, carbon-theme-g100).
- [x] Backend tarafinda template parametresi gecis taslagi.
- [x] Template registry MVP ihtiyac listesi.
Acceptance:
- [x] Template strategy notu tamam.

### ISSUE S0-06: Token Mapping Taslagi
Labels: [TEMPLATE] [DESIGN]
Goal: React/Carbon + Paged.js icin ortak token sozlugu taslaklansin.
Tasks:
- [x] Tipografi, renk, spacing token listesi.
- [x] Mevcut template dosyalarinda token kullanimi tespiti.
- [x] Token mapping tablosu taslak (common -> typst/quarto).
Acceptance:
- [x] Token mapping taslak dokumani tamam.

### ISSUE S0-07: AI Servis Plan ve Guvenlik
Labels: [AI] [SEC]
Goal: AI cagrilari server tarafina tasinsin, riskler kapansin.
Tasks:
- [x] AI endpoint taslagi (analyze, ask).
- [x] Rate limit ve audit log gereksinimleri.
- [x] Prompt dosyasi boyut limitleri ve cache plani.
- [x] Secret yonetimi (.env, server config).
Acceptance:
- [x] AI servis taslak plani tamam.

### ISSUE S0-08: Supabase Job Schema Taslagi
Labels: [DB]
Goal: Jobs ve job_events tablolarinin tasarimi net olsun.
Tasks:
- [x] jobs tablo kolonlari ve tipleri belirle.
- [x] job_events tablo kolonlari ve tipleri belirle.
- [x] Index ve RLS policy taslaklari.
- [x] Migration dosyasi yapisi belirle.
Acceptance:
- [x] DB taslak notu tamam.

### ISSUE S0-09: QA ve Observability Baslangic Seti
Labels: [QA] [OPS]
Goal: Minimum test ve log/metric standartlari.
Tasks:
- [x] Manuel test checklist yaz (upload, convert, error).
- [x] Log format standardi (request_id, job_id, error_code).
- [x] Metric listesi (latency, success rate, file size).
Acceptance:
- [x] Test checklist tamam.
- [x] Observability baslangic notu tamam.

### ISSUE S0-10: Risk ve Guvenlik Kayitlari
Labels: [SEC] [ARCH]
Goal: Sprint 0 riskleri ve onlemleri kayit altina al.
Tasks:
- [x] AI key sizintisi risk analizi.
- [x] File upload guvenligi (mimetype, size, scanning) notu.
- [x] Storage lifecycle ve temizleme plan taslagi.
Acceptance:
- [x] Risk listesi ve onlemler tamam.

### ISSUE S0-11: Dokumantasyon ve Sprint 0 Ozeti
Labels: [DOCS]
Goal: Tum kararlar ve planlar tek yerde toparlansin.
Tasks:
- [x] PROJE-TALIMATLARI.md ve IS-PLANI.md ile uyum kontrolu.
- [x] Sprint 0 summary dokumani taslagi.
- [x] Karar logu (decision log) taslagi.
Acceptance:
- [x] Sprint 0 summary tamam.

## 7. Acceptance Checklist (Detay)
- [x] API contract taslagi paylasildi
- [x] Job status akisi net
- [x] Supabase job tablosu tasarimlandi
- [x] Frontend endpoint gecis plani hazir
- [x] AI key server tarafina tasinacak plan var
- [x] Deploy modeli kararlastirildi
- [x] Risk listesi ve onlemler yazildi

## 8. Riskler ve Onlemler
- Netlify functions vs Express uyumsuzlugu
  - Onlem: tek API base URL karari
- Paged.js/headless chromium runtime bagimliligi
  - Onlem: containerized runtime secenegi
- AI key sizintisi
  - Onlem: server-side proxy + rate limit
- Preview/Output farki
  - Onlem: Paged.js preview

## 9. Gunluk Takip Format Ornegi
- Bugun hedef: <1-3 madde>
- Engeller: <varsa>
- Yarin hedef: <1-3 madde>

## 10. Demo ve Retro
- Demo: Sprint sonunda kararlarin ve planlarin sunumu
- Retro: Neler iyi gitti, neler iyilesmeli, aksiyonlar

## 11. Sahiplik (RACI Ornegi)
- Mimari Karar: Tech Lead (A), Backend (R)
- API Contract: Backend (R), Frontend (C)
- FE Refactor Plan: Frontend (R), Product (C)
- DB Taslak: Backend (R), Data (C)
- AI Servis Plan: Backend (R), Product (C)
- Deploy Karar: DevOps (R), Tech Lead (A)

## 12. Guncel Durum Profili
- Sprint 0 karar ve taslaklari tamamlandi; SoT ile uyumlu.
- Press Pack ve content schema yalnizca taslak seviyesinde; implementasyon sonraki fazlarda.

## 13. Sonraki Adimlar
- Sprint 1-2: pipeline ve Paged.js kurallari tamamlandiktan sonra Press Pack manifest formatini netlestir.
- Sprint 3: frontmatter wizard ile content schema'yi sahaya indir.
- Sprint 5-6: template registry + Press Pack paketleme akisini bagla.

## 14. Son Not
Sprint 0 tamamlandiginda, Faz 1 icin teknik yol haritasi ve net backlog cikmis olmalidir.

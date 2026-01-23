# FAZ 3 - SPRINT 6 DOKUMANTASYON (FINAL IMPLEMENTATION PLAN)

> Bu dokuman `docs/PROJE-TALIMATLARI.md`, `docs/SPRINT-0-DELIVERABLES.md` ve `docs/IS-PLANI.md` ile uyumlu olmak zorundadir.

## 0. Hizli Ozet
Sprint 6, CarbonPress uyumunu tamamlar: Press Pack manifest, block catalog, release metadata, editorial/publish akisi ve preflight gate ile template governance.

## 1. Amac ve Kapsam
Template sistemini sadece registry degil, yayinlanabilir bir release paketine donusturmek.

Kapsam dahili:
- Press Pack manifest schema (JSON/YAML) + dogrulama
- Block catalog (pattern sozlugu) + content schema mapping
- Release metadata + output manifest
- Editorial/publish akisi + API kontrati
- Preflight gate (lint + AI QA + schema validation)
- Template governance (versioning + approval workflow)

Kapsam disi:
- Billing ve usage limitleri (Sprint 7-8)
- Kurumsal SSO/SCIM
- Multi-region aktif/aktif

## 2. SoT Kararlari (Ozet)
- Rendering: React + Carbon Components
- Baski/PDF: Paged.js
- AI: Gemini 3 Pro (preview) + 2.5 Pro fallback
- Storage: Supabase buckets
- Kalite zinciri: lint + AI QA + preflight gate
- CarbonPress uyumu: Press Pack manifest + editorial states

## 3. Cikti ve Basari Kriterleri (Exit)
- Press Pack manifest schema versiyonlanmis ve dogrulanir.
- Block catalog ve content schema, frontmatter + layout JSON ile eslesir.
- Output manifest, release metadata ile birlikte saklanir.
- Editorial/publish akisi API ile calisir; preflight fail ise publish olmaz.
- Template governance state/approval kurallari uygulanir.

## 4. Teknik Tasarim Ozeti

### 4.1 Press Pack Manifest (Schema)
Press Pack, template versiyonu ile birlikte tasarim/pattern/QA kurallarini paketler.

Minimum alanlar:
- template: `{ key, version, engine, layoutProfile, printProfile, theme }`
- tokens: `{ typography, spacing, color, print }`
- patterns: `[{ id, blockType, required, components, rules }]`
- qaRules: `[{ id, type, severity, selector, action }]`
- sampleContent: `{ frontmatter, body }`
- metadata: `{ schemaVersion, createdAt, hash }`

Validasyon: server-side AJV/Zod ile.

### 4.2 Block Catalog + Content Schema
- Block catalog: `blockType` sozlugu (ExecutiveSummary, KeyFindings, WhatToDo, SurveyChartPage).
- Content schema alanlari: `docType`, `templateKey`, `layoutProfile`, `printProfile`, `theme`, `locale`, `version`.
- AI sadece block catalog icindeki modulleri secer; determinism artar.

### 4.3 Release Metadata + Output Manifest
- Job sonucuna `output_manifest` eklenir.
- Alanlar: template/version id, press_pack_hash, qa_summary, lint_summary, preflight_status, artifact list.
- Release kaydi, output manifest ile immutable olarak saklanir.

### 4.4 Editorial/Publish API Kontrati (Ozet)
- POST `/api/releases`
  - Body: `{ documentId, templateVersionId, pressPackVersion, notes }`
- PATCH `/api/releases/:id`
  - Body: `{ state: draft|review|approved|published }`
- POST `/api/releases/:id/preflight`
  - Response: `{ status, lint, qa, blockingIssues }`
- POST `/api/releases/:id/publish`
  - Response: `{ status, outputManifest }`
- GET `/api/releases/:id`
  - Response: `{ release, outputManifest, artifacts }`

### 4.5 Preflight Gate
- Gate kurali: `lint + QA + schema validation` hepsi basarili olmadan publish edilmez.
- Blocking issues: overflow, widow/orphan, contrast, invalid schema.

### 4.6 Template Governance
- State modeli: `draft -> review -> approved -> published`.
- Approval, template version bazinda tutulur.
- Geri cekme (rollback) sadece `approved` state'inde izinli.

## 5. Entegrasyon Akisi (Is Adimi)
1) Template version + Press Pack manifest kaydi
2) Content schema uyumlu doc hazirligi
3) Convert job -> output manifest
4) Preflight gate (lint + QA)
5) Editorial review -> publish

## 6. Sprint Takvimi
- G1-G2: Press Pack schema + validation
- G3-G4: Block catalog + content schema mapping
- G5-G6: Release metadata + output manifest
- G7-G8: Editorial/publish API + preflight gate
- G9: Template governance (approval/rollback)
- G10: Test, demo ve kapanis

## 7. Sprint 6 Backlog (Issue-Based)

### ISSUE F3-S6-01: Press Pack Manifest Schema
Labels: [SPEC] [API]
Goal: Press Pack JSON/YAML schema'si ve validation.
Tasks:
- [x] JSON Schema (draft 2020-12)
- [x] YAML ornek manifest
- [x] AJV/Zod validation
- [x] Schema versioning + hash
Acceptance:
- [x] Press Pack manifest API tarafinda dogrulanir

### ISSUE F3-S6-02: Block Catalog + Content Schema
Labels: [CONTENT] [AI]
Goal: Block catalog ve frontmatter schema eslesmesi.
Tasks:
- [x] blockType sozlugu
- [x] content schema (frontmatter) guncelleme
- [x] Template -> block whitelist
- [x] AI layout output dogrulama
Acceptance:
- [x] AI sadece whitelist blocklari kullanir

### ISSUE F3-S6-03: Release Metadata + Output Manifest
Labels: [API] [RENDER]
Goal: Job sonucunda release manifest kaydi.
Tasks:
- [x] output_manifest formatini sabitle
- [x] press_pack_hash + template_version_id ekle
- [x] QA/lint ozetlerini birlestir
- [x] Storage artifact listesi
Acceptance:
- [x] Release kaydi immutable manifest ile saklanir

### ISSUE F3-S6-04: Editorial/Publish API
Labels: [API]
Goal: Editorial states + publish kontrati.
Tasks:
- [x] release table + state modeli
- [x] POST /api/releases
- [x] PATCH /api/releases/:id (state transition)
- [x] POST /api/releases/:id/preflight
- [x] POST /api/releases/:id/publish
Acceptance:
- [x] Preflight fail ise publish engellenir

### ISSUE F3-S6-05: Preflight Gate Entegrasyonu
Labels: [QA] [PIPELINE]
Goal: Lint + QA sonucu publish gate'e baglansin.
Tasks:
- [x] Lint + QA raporu birlestir
- [x] Blocking rules (severity=high)
- [x] Publish step gating
- [x] Failure report (job_events)
Acceptance:
- [x] Blocking issue varsa publish olmaz

### ISSUE F3-S6-06: Template Governance + Approval
Labels: [GOV] [API]
Goal: Template version onay kurallari.
Tasks:
- [x] Approval state modeli
- [x] Reviewer rol kurali (min 1 onay)
- [x] Rollback policy
- [x] Governance UI (state + approval)
Acceptance:
- [x] Onay yoksa template publish edilmez

## 8. Ayrintili Task Breakdown

### F3-S6-01 Press Pack Manifest Schema
Breakdown:
- [x] Template + token + pattern + QA rule mapping
- [x] JSON schema dosyasi
- [x] YAML ornek
- [x] Schema validation testi

### F3-S6-02 Block Catalog + Content Schema
Breakdown:
- [x] Block catalog dokumani
- [x] Frontmatter schema (templateKey/locale/version)
- [x] Template bazli block whitelist
- [x] AI output validation

### F3-S6-03 Release Metadata + Output Manifest
Breakdown:
- [x] output_manifest field seti
- [x] Hash/versions (template/tokens/patterns)
- [x] Artifact list (pdf/png/json)
- [x] Release kaydi baglantisi

### F3-S6-04 Editorial/Publish API
Breakdown:
- [x] release state modeli
- [x] state transition kurallari
- [x] preflight endpoint
- [x] publish endpoint + ACL

### F3-S6-05 Preflight Gate Entegrasyonu
Breakdown:
- [x] lint + QA raporu merge
- [x] blocking rules (severity/high)
- [x] publish gate entegrasyonu

### F3-S6-06 Template Governance + Approval
Breakdown:
- [x] approval state
- [x] review/publish kurallari
- [x] governance UI

## 9. Bagimliliklar
- F3-S6-02 -> F3-S6-01 tamamlanmadan kapanmaz
- F3-S6-03 -> F3-S6-01 tamamlanmadan kapanmaz
- F3-S6-04 -> F3-S6-03 ve F3-S6-05 tamamlanmadan kapanmaz

## 10. Test ve Dogrulama
Minimum test senaryolari:
- Press Pack schema validation
- Block catalog whitelist enforcement
- Preflight fail -> publish reject
- Release manifest dogrulama

## 11. Cikti Artefaktlari
- Press Pack JSON/YAML schema dokumani
- Block catalog referansi
- Release/output manifest ornegi
- Editorial/publish API contract

## 12. Riskler ve Onlemler
- Schema drift -> versioning + hash zorunlu
- AI output sapmasi -> whitelist validation
- Governance gecikmesi -> default reviewer rol

## 13. CarbonPress Uyum Notu
- Press Pack manifest ve release metadata, CarbonPress publishing modelini birebir karsilar.

## 14. Guncel Durum Profili
- Press Pack + release pipeline backend implementasyonu tamamlandi.
- Preflight gating ve output manifest aktif; migration uygulanmasi bekleniyor.
- Governance UI ve reviewer rol kurallari tamamlandi; rollback policy beklemede.

## 15. Sonraki Adimlar
- Supabase migration `005_press_pack_release.sql` uygula.
- Governance UI ve reviewer rol kurallarini tamamla.
- Preflight job_events rapor kaydini ekle.

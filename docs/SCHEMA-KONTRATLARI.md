# Schema ve Kontrat Referansi

> Bu dokuman SoT ile uyumlu kontratlari tek noktada toplar.
> Detayli guncellemelerde SoT (docs/PROJE-TALIMATLARI.md) once guncellenir.

## 1) Unified Error Payload
```json
{
  "error": {
    "code": "STRING",
    "message": "STRING",
    "details": "ANY",
    "request_id": "UUID"
  }
}
```

## 2) Job State Kontrati
- `queued -> processing -> completed|failed|cancelled`
- Retry: max 3, exponential backoff

## 3) Job Events Kontrati
Alanlar:
- `jobId` (uuid)
- `status` (queued|processing|completed|failed|cancelled)
- `stage` (ingest|parse|plan|render-html|paginate|export-pdf|postprocess|upload|complete)
- `progress` (0-100)
- `message`, `level`, `requestId`
- `error` (code/message/details)
- `metadata`
- `createdAt`

Schema: `docs/schemas/job-event.schema.json`

Ornek:
```json
{
  "jobId": "0b8b6d5b-6a5b-4a2c-92df-4c0b03ec1bb2",
  "status": "processing",
  "stage": "render-html",
  "progress": 45,
  "message": "HTML render tamamlandi",
  "level": "info",
  "requestId": "req-123",
  "createdAt": "2025-01-21T10:15:30Z"
}
```

## 4) Frontmatter Schema
Zorunlu alan seti:
- `docType` (canonical)
- `templateKey`
- `layoutProfile`
- `printProfile`
- `theme`
- `locale`
- `version`

Opsiyonel:
- `title`, `author`, `date`, `status`, `tone`

Not:
- `documentType` geri uyumluluk icin kabul edilir ve `docType`'a map edilir.

Ornek:
```yaml
---
title: "Quarterly Report"
author: "Cureonics"
docType: report
layoutProfile: symmetric
printProfile: pagedjs-a4
theme: white
locale: tr-TR
version: v1
---
```

## 5) AI LayoutInstruction Schema (DocumentPlan + LayoutPlan)
Ust seviye alanlar:
- `layoutProfile`, `printProfile`, `gridSystem`
- `documentPlan`: semantik iskelet (bolumler + gerekli bloklar)
- `layoutPlan`: uzamsal yerlesim (grid + component listesi + page breaks)
- `components`: LayoutPlan ile ayni format (geri uyumluluk)
- `storytelling`: executive summary + key insights + methodology notes + sources
- `styleHints`: avoid/force break selectors

StyleOverrides whitelist:
- `theme` (white|g10|g90|g100) disinda styleOverrides kabul edilmez.

Schema: `docs/schemas/layout-instruction.schema.json`

Ornek (ozet):
```json
{
  "layoutProfile": "symmetric",
  "printProfile": "pagedjs-a4",
  "documentPlan": {
    "sections": [
      { "id": "intro", "title": "Ozet", "requiredBlocks": ["ExecutiveSummary"] }
    ]
  },
  "layoutPlan": {
    "gridSystem": "symmetric",
    "components": [
      { "type": "HighlightBox", "layoutProps": { "colSpan": 16 } }
    ]
  },
  "storytelling": {
    "executiveSummary": "Genel performans yukseliyor.",
    "keyInsights": ["Gelir 3 ceyrektir artiyor."],
    "methodologyNotes": "Online anket, n=120, TR geneli.",
    "sources": ["Internal survey dataset v3"]
  },
  "styleHints": {
    "avoidBreakSelectors": ["table", "blockquote"],
    "forceBreakSelectors": ["h2"]
  }
}
```

## 6) Directive DSL Schema
Directive syntax ve mapping kurallari: `docs/DIRECTIVE-DSL.md`

Schema: `docs/schemas/directive-dsl.schema.json`

## 7) Component AST Schema
ComponentNode standardi: `docs/COMPONENT-AST.md`

Schema: `docs/schemas/component-node.schema.json`

## 8) Output Manifest Schema
Worker PDF ciktisi ile birlikte metadata/QA/preflight bilgilerini tek payload'da tasir.

Schema: `docs/schemas/output-manifest.schema.json`

Not: `preflight.qualityChecklist` EK-GELISTIRME kalite kontrol listesinin sonuclarini tasir.

Ornek (ozet):
```json
{
  "schemaVersion": "v1.0",
  "generatedAt": "2025-01-21T12:34:56Z",
  "jobId": "0b8b6d5b-6a5b-4a2c-92df-4c0b03ec1bb2",
  "documentId": "9e5e8e0e-9f44-4a2e-9a1d-1b6d11cf51a4",
  "userId": "a0ab95f1-2c1f-4d0a-8f88-4b243d69a4e9",
  "template": {
    "key": "executive-report",
    "templateId": "tmpl_123",
    "versionId": "tmpl_v3",
    "layoutProfile": "symmetric",
    "printProfile": "pagedjs-a4",
    "theme": "white"
  },
  "qa": {
    "summary": { "score": 92, "issues": 1 },
    "accessibilitySummary": { "violations": 0 }
  },
  "artifacts": {
    "pdf": {
      "bucket": "pdfs",
      "path": "user_id/document_id/job_id/report.pdf",
      "signedUrl": "https://signed.example",
      "signedUrlExpiresAt": "2025-01-21T13:34:56Z"
    }
  }
}
```

## 9) Pattern Registry
Pattern library modulleri ve props kontratlari.

Registry: `patterns/registry.json`  
Schema dosyalari: `patterns/schemas/*.schema.json`

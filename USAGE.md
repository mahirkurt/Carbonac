# Carbonac - Kullanım Kılavuzu

## Hızlı Başlangıç

### 1. Kurulum

Gereksinimler:
- Node.js 20.19+ (AI/worker için zorunlu)
- Headless Chromium (server-side PDF üretimi için)

Kurulum:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend + Worker

```bash
node backend/server.js
node backend/worker.js
```

### 3. Frontend

```bash
cd frontend
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışır.

## CLI (Batch Build)

Tek dosya:
```bash
npx carbonac build report.md --html --png
```

QA odaklı build:
```bash
npx carbonac qa report.md --output-dir output/qa
```

Birden fazla dosya + paralel:
```bash
npx carbonac build docs/*.md --output-dir output/cli --concurrency 2
```

Cache varsayılan olarak aktiftir (`.cache/carbonac`). Kapatmak için:
```bash
npx carbonac build report.md --no-cache
```


## Temel Akış

1. Dosya yükleme veya markdown içerik oluşturma
2. Gemini 3 Pro art director ile layout JSON üretimi
3. React + Carbon render
4. Paged.js ile PDF üretimi
5. Supabase storage ve signed URL ile download

## API Kullanımı

### PDF Üretimi

```bash
curl -X POST http://localhost:3001/api/convert/to-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "uuid",
    "markdown": "# Rapor",
    "settings": {
      "template": "carbon-default",
      "theme": "white",
      "layoutProfile": "asymmetric",
      "printProfile": "pagedjs-a4"
    }
  }'
```

Yanıt:
```json
{ "jobId": "uuid", "status": "queued" }
```

### Job Durumu

```bash
curl http://localhost:3001/api/jobs/<jobId>
```

### Download

```bash
curl -L http://localhost:3001/api/jobs/<jobId>/download -o report.pdf
```

## Ortam Değişkenleri

Backend:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET_DOCUMENTS` (varsayılan: documents)
- `SUPABASE_BUCKET_PDFS` (varsayılan: pdfs)
- `REDIS_URL`
- `JOB_QUEUE_NAME`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (varsayılan: gemini-3-pro-preview)
- `GEMINI_FALLBACK_MODEL` (varsayılan: gemini-2.5-pro)
- `ART_DIRECTOR_PROMPT_VERSION` (v1|v2)
- `ART_DIRECTOR_PROMPT_ROLLBACK` (v1|v2)

Print:
- `PRINT_TYPOGRAPHY_SMARTYPANTS` (true|false)
- `PRINT_HYPHENATION` (auto|none)
- `PRINT_CHART_RENDERER` (true|false)
- `PRINT_TABLE_SPLIT_MIN_ROWS`
- `PRINT_TABLE_SPLIT_MIN_ROWS_PER_PAGE`

QA:
- `PDF_QA_VISUAL_REGRESSION` (true|false)
- `PDF_QA_VISUAL_THRESHOLD` (0-1)
- `PDF_QA_VISUAL_MAX_MISMATCH_RATIO` (0-1)
- `PDF_QA_AXE_TAGS` (comma separated)
- `PDF_QA_BASELINE_DIR` (default: output/qa-baselines)
- `PDF_QA_DIFF_DIR` (default: output/qa-diffs)

Frontend:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Paged.js Print CSS Notları

- `@page` ile A4/A3, margin, bleed ve mark kontrolü
- `.avoid-break` ve `.force-break` sınıfları ile sayfa kırılımları
- `@page :left/:right` ile cilt payı ve header/footer

## Sorun Giderme

- Redis bağlantısı: `REDIS_URL` değerini kontrol edin
- PDF çıktısı yoksa: headless Chromium erişimi ve `CHROMIUM_PATH` kontrolü
- Storage hatası: Supabase bucket izinlerini kontrol edin

## Destek

Sorun bildirmek için GitHub Issues kullanın.

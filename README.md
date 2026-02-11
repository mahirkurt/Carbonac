# Carbon AI Report Engine

🎨 IBM Carbon Design System + Gemini 3 Pro + Paged.js ile akilli, matbaa kalitesinde PDF rapor ureten platform.

## Features

- ✨ **React + Carbon Components** - Gorunum icin tek kaynak, tutarli tasarim
- 🧠 **Gemini 3 Pro Art Director** - Uzamsal muhakeme, data storytelling, layout JSON
- 📰 **Paged.js Print CSS** - A4/A3 sayfalama, bleed, crop/cross marks
- 📦 **Queue + Worker** - Redis + BullMQ ile is akisi ve retry
- ☁️ **Supabase Storage** - Standard path, signed URL download
- 🎨 **Tema Desteği** - White, G10, G90, G100

## Installation

### System Dependencies

- Node.js 20.19+ (AI/worker icin zorunlu)
- Headless Chromium (server-side PDF uretimi icin)

### Node Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Usage

### Backend + Worker

```bash
node backend/server.js
node backend/worker.js
```

### Frontend

```bash
cd frontend
npm run dev
```

### API Ornek

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

## Raspberry Remote Runtime

Raspberry Pi uzerinden Docker ile calistirma:
- `docs/RASPBERRY-DOCKER.md`

## Documentation Map

- Source of truth and AI agent instructions: `docs/PROJE-TALIMATLARI.md`
- Consolidated architecture + current status: `docs/PROJE-MIMARISI.md`
- Sprint 0 decisions + API contract: `docs/SPRINT-0-DELIVERABLES.md`
- Phase/sprint plan: `docs/IS-PLANI.md`
- Archived sprint detail plans: `docs/archive/FAZ-0-SPRINT-0.md`, `docs/archive/FAZ-1-SPRINT-1.md`, `docs/archive/FAZ-1-SPRINT-2.md`
- Remote runtime runbook: `docs/RASPBERRY-DOCKER.md`
- Long-term reference roadmap (archived): `docs/archive/YOL-HARITASI-REFERANS.md`

## Project Structure

```
.
├── backend/              # API + worker
├── frontend/             # React UI
├── docs/                 # Source of truth + plans
├── styles/               # Carbon design styles
├── templates/            # Template registry (plan)
├── output/               # Generated PDFs
└── src/                  # Shared utils + AI modules
```

## License

MIT

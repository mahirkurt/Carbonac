# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

Carbonac is an AI-powered PDF report engine that converts Markdown to print-ready PDFs using IBM Carbon Design System, Gemini AI art direction, and Paged.js print CSS. Node.js monorepo with three workspaces: root (CLI + shared modules), backend (Express API + BullMQ worker), and frontend (React + Carbon Components).

## Quick Start

```bash
# Install all dependencies (Node >= 20.19.0 required)
npm install && cd backend && npm install && cd ../frontend && npm install && cd ..

# Start everything (api + worker + frontend concurrently)
npm run dev

# Or start individually (each has --watch for auto-reload)
npm run dev:api              # backend API on port 3001
npm run dev:worker           # BullMQ worker
npm run dev:frontend         # frontend on port 3000, proxies /api → localhost:3001
```

## Commands

```bash
# Tests (root)
npm test                        # unit + integration (runs both below)
npm run test:unit               # node src/test.js (markdown parsing, HTML gen, file checks)
npm run test:integration        # preflight integration (full Paged.js pipeline)
npm run test:smoke              # API E2E: creates job, polls, downloads PDF
npm run test:qa                 # QA harness: visual regression + a11y + AI review

# Frontend tests
cd frontend && npm test         # vitest run (single run)
cd frontend && npm run test:watch  # vitest in watch mode
cd frontend && npm run typecheck   # tsc --noEmit
cd frontend && npm run build       # production build (Vite 7)

# Smoke tests against custom API
API_BASE_URL=https://api.carbonac.com API_AUTH_TOKEN=... npm run test:smoke

# Linting
npm run lint:tokens             # no hard-coded hex/px in styles/print/**/*.css

# CLI conversion
node src/cli.js examples/sample.md   # convert markdown → PDF
npm run example                      # quick test with sample.md

# QA baselines
npm run qa:update-baselines     # update visual regression baselines

# Docker (unified compose with profiles)
docker compose --profile full up -d                                          # Full stack (dev)
docker compose --env-file .env --env-file .env.pi --profile pi up -d        # Pi: Redis + API (port 3003)
docker compose --env-file .env --env-file .env.hp --profile hp-worker up -d  # HP: Worker only

# Infrastructure management (Pi/HP via CureoHub SSH)
python3 scripts/infra.py start-pi       # Pi: Redis + API
python3 scripts/infra.py start-hp       # HP: Worker
python3 scripts/infra.py start          # Both nodes
python3 scripts/infra.py stop           # Both nodes
python3 scripts/infra.py status         # Container status on both nodes
python3 scripts/infra.py logs-pi        # Pi compose logs
python3 scripts/infra.py logs-hp        # HP compose logs
```

## Architecture

### Monorepo Structure

```
backend/          Express 5 API (port 3001) + BullMQ worker
frontend/         React 19 SPA with Vite 7 + Carbon Components v11
src/              Shared CLI, conversion pipeline, AI modules, utils
styles/           Carbon design tokens (styles/carbon/) + print CSS (styles/print/) + fonts
templates/        Carbon-based template registry (16+ templates, each has overrides.json)
tokens/           Design token definitions for printing
supabase/         Database migrations and seed data
docs/             Project documentation (Turkish)
scripts/          CI checks, token linting, test harnesses
```

### Core Data Flow (PDF Generation)

1. User submits markdown + settings via frontend or API (`POST /api/convert/to-pdf`)
2. Backend creates a BullMQ job in Redis, returns `jobId`
3. Worker picks up job and runs the pipeline:
   - **Parse** (15%): Extract YAML frontmatter, parse markdown (`src/utils/markdown-parser.js`)
   - **Plan** (30%): AI art direction via Gemini → layout JSON (`src/ai/art-director.js`)
   - **Render HTML** (45%): Markdown → styled HTML with Carbon tokens + directives
   - **Paginate** (60%): Paged.js pagination in headless Chromium (`src/convert-paged.js`)
   - **Postprocess** (70%): PDF metadata, optional PDF/A compliance (`src/utils/pdf-postprocess.js`)
   - **Upload** (92%): Upload to Supabase Storage, generate signed download URL
4. Frontend polls `GET /api/jobs/:id` until completion

### Backend API Routes

| Group | Key Endpoints |
|-------|---------------|
| **Conversion** | `POST /api/convert/to-markdown` (upload), `POST /api/convert/to-pdf` |
| **Jobs** | `POST /api/jobs`, `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs/:id/retry`, `POST /api/jobs/:id/cancel`, `GET /api/jobs/:id/download` |
| **AI** | `POST /api/ai/analyze`, `POST /api/ai/ask`, `POST /api/ai/markdown-to-carbon-html` |
| **Templates** | CRUD + `POST /api/templates/:id/versions`, `POST /api/templates/:id/rollback`, `PATCH /api/template-versions/:id/status`, `POST /api/templates/:id/preview` |
| **Press Packs** | `GET /api/press-packs`, `POST /api/press-packs`, `PATCH /api/press-packs/:id` |
| **Releases** | `POST /api/releases`, `POST /api/releases/:id/preflight`, `POST /api/releases/:id/publish` |
| **Import** | `POST /api/import/google-docs` |
| **Metrics** | `GET /api/metrics` (JSON), `GET /api/metrics/dashboard` (HTML), `GET /api/health` |

Rate limits: API 60 req/5min, AI 20 req/15min.

### Backend Key Files

- `backend/server.js` — Express API (35+ endpoints), CORS, rate limiting, request ID tracking, metrics
- `backend/worker.js` — BullMQ worker: convert-pdf, convert-md, template-preview jobs (concurrency: 2)
- `backend/auth.js` — Supabase JWT token validation middleware
- `backend/job-store.js` — Job CRUD + event tracking in Supabase
- `backend/preflight.js` — Quality checklist validation (print geometry, a11y, typography)

### Frontend Architecture

- **State management:** React Context — AuthContext, DocumentContext (~949 lines, manages full workflow state), ThemeContext, PricingContext
- **5-step workflow:** Upload → Processing → Wizard → Editor → Preview
- **Routing:** Hash-based (`#workflow`, `#templates`, `#documents`, `#jobs`, `#quality`, `#callback`, `#reset-password`)
- **Entry point:** `frontend/src/App.jsx` wraps providers; `AppContent` handles routing
- **Key components:** ReportWizard (8-question AI-guided design), PreviewPanel, DocumentsPanel, JobsPanel, QualityPanel
- **Lazy-loaded:** SettingsModal, AuthModal, PricingModal, DocumentUploader, ReportWizard, TemplateGallery, CarbonacAiChat
- **Feature flags:** `VITE_PASSWORD_GATE` (password protection), `VITE_GUEST_MODE` (guest access without auth)
- **SCSS:** Carbon components use SCSS; `sass`/`sass-embedded` compiles them. Vite config suppresses Carbon deprecation warnings.

### Shared Core Modules

- `src/cli.js` — Commander.js CLI entry point (`carbonac` / `carbon-pdf` / `carbon-advisor` binaries)
- `src/convert-paged.js` — Full Paged.js conversion pipeline (HTML assembly → Chromium → PDF), includes QA pipeline
- `src/ai/art-director.js` — Gemini layout planning: component + grid JSON, storytelling metadata; uses Zod schema validation
- `src/utils/markdown-parser.js` — unified + remark-parse/gfm/smartypants/directive + rehype pipeline
- `src/utils/directive-mapper.js` — Remark plugin: 11 directive types → HTML with Carbon classes

### QA Pipeline

Built into `src/convert-paged.js`, runs during PDF generation:
- **Visual regression:** PNG diff against baseline with configurable threshold
- **Accessibility:** Axe Core with WCAG 2.0 AA/AAA rules
- **Typography:** Orphans, widows, hyphenation checks
- **Print geometry:** A4/bleed/marks validation
- **AI review:** Gemini summarizes issues and assigns severity (low/medium/high)
- **Iterative refinement:** Up to 2 iterations to fix detected issues

## Conventions

### ES Modules
- All code uses `import`/`export` — never `require()`
- File extensions required in imports: `import { fn } from './file.js'`
- Use `import.meta.url` for `__dirname` equivalent

### Carbon Design Tokens
- **Colors:** 10 shades per family (10–100). Primary: `blue-60` (#0f62fe)
- **Typography:** IBM Plex Sans/Serif/Mono. Productive + Expressive type sets
- **Spacing:** 8px base unit. Tokens `spacing-01` (2px) to `spacing-13` (160px)
- **Themes:** White (default), G10 (light gray), G90 (dark), G100 (full dark)
- **Token files:** `styles/carbon/` (colors, typography, spacing, grid, theme), `styles/print/` (A4/A3 print profiles, fonts)
- **No hard-coded values:** Print CSS must use CSS custom properties, enforced by `scripts/token-lint.js`

### Directive System
Custom markdown directives (remark-directive) for structured content blocks. Defined in `src/utils/directive-mapper.js`:

`:::callout` (tones: info/warning/success/danger), `:::data-table`, `:::chart` (20+ chart types), `:::code-group`, `:::figure`, `:::quote`, `:::timeline`, `:::accordion`, `:::marginnote`, `:::pattern`, `:::spacer`

### Layout + Print Profiles
- **Layout:** `symmetric` (traditional), `asymmetric` (modern offset), `dashboard` (data-dense)
- **Print:** `pagedjs-a4`, `pagedjs-a3`

### Template System
Templates in `templates/` (16+) with versioning workflow: **draft → review → approved → published**. Each template has:
- `overrides.json` — CSS variable overrides (per-theme if needed)
- Schema JSON — layout/print/theme settings (stored in `template_versions` table)
- Optional press pack — block catalog, QA rules, content schema, token overrides

### AI Models
- Primary: `gemini-3-pro-preview`, Fallback: `gemini-2.5-pro`
- Custom tuned model for Carbon HTML conversion (`GEMINI_CARBON_HTML_MODEL` env var)
- Art director uses Zod schema validation for layout JSON output

## CI/CD

### GitHub Actions (`ci.yml`)
1. **SoT check** — If `docs/PROJE-TALIMATLARI.md` changed, dependent docs must also update (`scripts/check-sot.js`)
2. **DoD check** — Validates Definition of Done and PR template exist (`scripts/check-dod.js`)
3. **Install + Unit/Integration tests** — `npm ci && npm test`
4. **QA harness** (optional, workflow_dispatch) — Visual regression with Chromium
5. **API smoke** (optional, workflow_dispatch) — Full E2E against live API

### Deployment
- **Frontend:** Netlify (build: `frontend/`, publish: `dist/`, SPA fallback redirects) + GitHub Pages (`deploy-pages.yml` → `carbonac.com`)
- **Backend/Worker:** Docker on Raspberry Pi (port 3003) or HP server (port 3001) with Redis (`deploy-hp.yml`)

## Environment Variables

Copy `.env.example` (root) and `frontend/.env.example` to `.env` files. Critical variables:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Gemini AI for art direction and QA |
| `REDIS_URL` | Redis connection for BullMQ job queue |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Database, auth, storage |
| `VITE_API_URL` | Frontend → backend API base URL |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium path (Docker: `/usr/bin/chromium`) |

## Documentation Map

Primary documentation is in `docs/` (Turkish):

| Document | Role |
|----------|------|
| `docs/PROJE-TALIMATLARI.md` | **Source of truth** — design system standards, Carbon v11 specs. CI enforces dependent doc updates when this changes. |
| `docs/SPRINT-0-DELIVERABLES.md` | API contract, decision log, DB schema |
| `docs/DEFINITION-OF-DONE.md` | DoD checklist (CI-enforced) |
| `docs/DIRECTIVE-DSL.md` | Directive syntax documentation |
| `docs/RASPBERRY-DOCKER.md` | Remote runtime runbook (Docker + Cloudflare tunnel) |

### Supabase Schema

Key tables are defined in `supabase/migrations/`. Core tables: `profiles`, `documents`, `jobs`, `job_events`, `templates`, `template_versions`, `press_packs`, `releases`, `usage_stats`/`usage_events`. Storage buckets: `documents`, `pdfs`, `avatars`, `template-previews`.

## Legacy Note

`.github/copilot-instructions.md` references Typst and Quarto engines — these are **legacy**. The current pipeline uses **Paged.js** exclusively. Ignore Typst/Quarto references in that file.

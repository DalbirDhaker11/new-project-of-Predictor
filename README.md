<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Employee Resignation Risk Predictor

Frontend: React + Vite (TypeScript). Backend: Python (FastAPI) + Gemini API. Database: MongoDB (optional — falls back to in-memory automatically).

## Run Locally

**Prerequisites:** Node.js 18+, Python 3.10+

1. Install frontend dependencies:
   ```
   npm install
   ```
2. Install backend dependencies:
   ```
   cd backend && pip install -r requirements.txt && cd ..
   ```
3. Copy `.env.example` to `.env` and set:
   - `GEMINI_API_KEY` — your Gemini API key (required for AI drafting/compare/chat; without it, the app still runs with demo-mode templated drafts).
   - `MONGODB_URI` — optional. If set, employee data persists across restarts. If left blank, the app runs entirely in-memory with a synthetic demo dataset seeded on startup.
4. Run the backend (from the project root, in one terminal):
   ```
   npm run backend
   ```
   This starts FastAPI on `http://localhost:8000`.
5. Run the frontend (in a second terminal):
   ```
   npm run dev
   ```
   This starts Vite on `http://localhost:5173` and proxies `/api/*` requests to the backend.

## Production build

```
npm run build
```

This builds the frontend into `dist/`. The FastAPI backend (`backend/main.py`) automatically serves `dist/` as static files when that directory is present, so in production you only need to run the backend:

```
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

## Project structure

- `src/` — React frontend (App.tsx, components, styles)
- `backend/` — Python FastAPI backend
  - `main.py` — API routes (employees, train, draft, auto-compare, chat, health, audit log, import history)
  - `model.py` — decision tree classifier + synthetic HR data generator
  - `db.py` — optional MongoDB persistence layer (Motor / async), safe no-op if `MONGODB_URI` isn't set

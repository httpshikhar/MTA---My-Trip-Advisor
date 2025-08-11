MTA Planner monorepo

Backend: FastAPI at `backend/app.py`
Frontend: React (Vite + Tailwind) in `frontend/`

Run backend:
1) Create venv and install deps
   python3 -m venv .venv
   . .venv/bin/activate
   pip install -r backend/requirements.txt
2) Export env vars in `.env` at repo root: `ENDPOINT_URL`, `DEPLOYMENT_NAME`, `AZURE_OPENAI_API_KEY`, `PERPLEXITY_API_KEY`
3) Start API
   uvicorn backend.app:app --reload --port 8000

Run frontend:
   cd frontend
   npm install
   npm run dev

Open http://localhost:5173. API is proxied at /api.

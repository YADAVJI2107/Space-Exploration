# 3D Space Exploration Simulation

Production-ready full-stack simulation with Next.js App Router, React Three Fiber, Drei, Tailwind CSS, Zustand, FastAPI, Docker Compose, and Traefik.

## Run

```bash
docker-compose up --build
```

Open locally:

- App: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/health`

The default compose file is configured for local testing without Traefik or any reverse proxy. `traefik.yml` is kept only as optional infrastructure reference.

## Local Development

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Planet textures are bundled under `frontend/public/textures` from Solar System Scope's public texture downloads. The frontend falls back to local sample data if the API is not reachable.

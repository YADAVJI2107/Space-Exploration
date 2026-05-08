# Current State

## Overview

This repository is a full-stack 3D space exploration simulator. The current product is a browser-based solar-system experience with textured planets, orbit paths, camera following, procedural deep-space layers, and optional frontend N-body stepping.

The app is already beyond a beginner Three.js demo: it has a clear frontend/backend split, typed frontend models, FastAPI schemas, local fallback data, Docker Compose, and a growing test setup. It is not yet a production platform, scientific data service, or authoritative simulation engine.

## Frontend Architecture

- Framework: Next.js App Router with React 19 and TypeScript.
- Rendering: React Three Fiber, Drei, and Three.js.
- Styling: Tailwind CSS with custom global styles in `frontend/app/globals.css`.
- State: Zustand store in `frontend/lib/store.ts`.
- Entry point: `frontend/app/page.tsx` renders `SpaceSimulation`.
- Main scene: `frontend/components/space/SolarSystemScene.tsx`.
- UI controls: `frontend/components/ui/ControlPanel.tsx`.

The frontend owns most of the user-facing experience. It loads planets/config through `useSpaceData`, merges backend config with fallback config, renders the simulation, and synchronizes some control changes back to the backend.

## Rendering Pipeline

The render tree is centered around `Canvas` in `SpaceSimulation`. `SolarSystemScene` adds camera, fog, lighting, galaxy backdrop, nebula field, dust, instanced stars, sun, orbit paths, planets, controls, and camera rig.

Current visual capabilities:

- Textured planets from bundled assets in `frontend/public/textures`.
- Sun mesh and lighting.
- Orbit path rendering.
- Instanced star fields.
- Procedural galaxy backdrop.
- Procedural nebula particles and cloud meshes.
- Procedural dust particles.
- Saturn ring texture support.
- Selection halo and HTML label for selected planet.
- OrbitControls plus a custom camera rig for follow/system targeting.

The scene uses standard materials and additive point materials. There is no postprocessing pipeline, bloom, HDR environment workflow, atmospheric scattering shader, planet cloud layer, dynamic eclipse model, or texture streaming yet.

## Simulation And Physics

The app currently supports two frontend position modes:

- Kepler-style orbital position calculation in `frontend/lib/orbital.ts`.
- Simplified N-body stepping in `frontend/lib/nbody.ts`.

`SolarSystemScene` keeps mutable refs for elapsed simulation days, galactic progress, and optional N-body state. On each R3F frame it:

- Advances elapsed days according to `timeScale`.
- Moves/rotates the solar-system root for cinematic galactic drift.
- Initializes or advances N-body state when enabled.

`PlanetMesh` chooses its position from N-body state when available, otherwise from `orbitalPosition`.

The N-body module supports:

- Mass ratios relative to Earth mass.
- Sun gravity as a fixed central acceleration.
- Pairwise planet gravity.
- Softening.
- Euler-style velocity/position integration.

This is useful for interactive demonstration, but it is not yet a deterministic, validated, high-precision simulation engine.

## State Management

Zustand stores client UI and simulation controls:

- `timeScale`
- `isPaused`
- `viewMode`
- `selectedPlanet`
- `followTarget`
- `showOrbits`
- `nBodyEnabled`
- `gravityScale`
- `showGalaxy`
- `showNebula`
- `showDust`

The store is simple and effective for the current app. It currently mixes UI preferences, simulation controls, camera mode, and visual-layer toggles in one store.

## API And Data Flow

The frontend API client lives in `frontend/lib/api.ts`.

Current API calls:

- `GET /planets`
- `GET /simulation/config`
- `POST /simulation/update`

The client falls back to local planet/config data if requests fail. The control panel now shows a `Fallback` status when API data is unavailable, while still allowing the simulation to run with bundled data.

Current data flow:

1. `useSpaceData` starts with fallback planets and fallback config.
2. It fetches backend planets and backend simulation config.
3. It merges simulation config with frontend fallback config.
4. It tracks whether data came from the API or fallback data.
5. It writes selected config values into Zustand.
6. UI control changes update Zustand immediately and call `POST /simulation/update` best-effort.

The frontend is mostly authoritative for rendering and simulation. The backend is currently a data/config service, not the source of truth for simulation state.

## Backend Architecture

The backend is a compact FastAPI app.

Key files:

- `backend/app/main.py`
- `backend/app/routers/planets.py`
- `backend/app/routers/simulation.py`
- `backend/app/schemas/planet.py`
- `backend/app/schemas/simulation.py`
- `backend/app/services/planet_service.py`
- `backend/app/services/simulation_service.py`
- `backend/app/services/physics_service.py`

Current backend capabilities:

- Health endpoint at `/health`.
- Planet constants served from in-memory Python objects.
- Simulation config served and updated in memory.
- Optional backend position computation when `backend_driven` is requested.
- Pydantic camelCase aliases for frontend compatibility.
- Permissive CORS.

There is no database, cache, task queue, authentication, API versioning, rate limiting, structured logging, metrics, or external NASA/JPL integration yet.

## API Contract Consistency

Frontend and backend now agree on the core simulation config fields, including `gravityScale` / `gravity_scale`. This field is covered by backend API tests to ensure camelCase request/response behavior continues to round-trip correctly.

The next contract risk is broader schema drift as NASA/JPL metadata, richer simulation modes, and data-source status fields are introduced.

## Testing Coverage

Frontend test infrastructure exists:

- `frontend/vitest.config.ts`
- `frontend/vitest.setup.ts`
- `frontend/lib/orbital.test.ts`
- `frontend/lib/nbody.test.ts`
- `frontend/components/ui/ControlPanel.test.tsx`

Backend test infrastructure is not present yet. There are no Pytest API tests, no simulation correctness fixtures, no Playwright visual/e2e tests, and no performance benchmarks.

Verification during audit and first continuation pass:

- `python -m compileall app` passed for the backend.
- `python -m pytest` passed for the backend after installing backend requirements.
- `npm run lint` could not run locally because `eslint` was not recognized.
- `npm run test:run` could not run locally because `vitest` was not recognized.

The frontend command failures indicate local dependencies are not installed or `node_modules/.bin` is unavailable in the current environment.

## Docker And Deployment

The repository includes:

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `traefik.yml`

Docker Compose runs frontend and backend on a shared bridge network, exposes frontend on port 3000 and backend on port 8000, and waits for backend health before starting the frontend.

The setup is good for local production-like testing. It is not yet a complete production deployment system with environment separation, TLS, CDN asset strategy, CI/CD, observability, or managed database/cache services.

## Security And Operations

Current operational posture is development/demo oriented:

- CORS allows all origins.
- No auth or user/session model.
- No rate limiting.
- No request logging strategy beyond FastAPI/Uvicorn defaults.
- No structured error reporting.
- No secrets management pattern.
- No external API keys or NASA data sources configured.
- Simulation config is global in-memory process state.

## Summary

The current implementation is a strong interactive foundation: visually engaging, modular enough to evolve, and already using the right core technologies. The next step is to stabilize contracts, separate simulation concerns, improve observability of API/data failures, and then build cinematic visuals plus real astronomical data on top of a cleaner architecture.

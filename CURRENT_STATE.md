# Current State

## Overview

This repository is a full-stack 3D space exploration simulator. The current product is a browser-based solar-system experience with textured planets, orbit paths, camera following, procedural deep-space layers, and frontend simulation controls.

The app is beyond a beginner Three.js demo: it has a clear frontend/backend split, typed frontend models, FastAPI schemas, local fallback data, Docker Compose, and a growing implementation of NASA integration. It is still not a production platform, scientific data service, or fully authoritative simulation engine.

## Phase Summary

- **Phase 1: Stabilize architecture and contracts** — largely done.
- **Phase 2: Visual and interaction upgrade** — implemented.
- **Phase 3: Real NASA/JPL data integration & persistence** — next.
- **Phase 4: Simulation engine separation & backend authority** — next.
- **Phase 5: CI/CD, testing, and performance validation** — future.

## Frontend Architecture

- Framework: Next.js App Router with React 19 and TypeScript.
- Rendering: React Three Fiber, Drei, and Three.js.
- Styling: Tailwind CSS in `frontend/app/globals.css`.
- State: Zustand store in `frontend/lib/store.ts`.
- Entry point: `frontend/app/page.tsx` renders `SpaceSimulation`.
- Main scene: `frontend/components/space/SolarSystemScene.tsx`.
- UI controls: `frontend/components/ui/ControlPanel.tsx`.
- Planet info: `frontend/components/space/PlanetInfoPanel.tsx`.

The frontend loads planets/config through `useSpaceData`, merges backend config with fallback config, renders the simulation, and synchronizes selected simulation settings with the backend.

## Rendering Pipeline

`SpaceSimulation` sets up the `Canvas`, camera, tone mapping, and background. `SolarSystemScene` includes:

- Fog, ambient and hemisphere lighting
- Procedural galaxy backdrop
- Nebula field and deep-space dust
- Instanced star fields
- Sun mesh and orbit paths
- Planet meshes with texturing and rings
- Orbit controls and a custom `CameraRig`
- Cinematic camera transitions
- Postprocessing effects for bloom and vignette

Current visual capabilities:

- Textured planets from `frontend/public/textures`
- Sun mesh and lighting
- Orbit path rendering
- Instanced star fields
- Procedural galaxy backdrop
- Procedural nebula particles and cloud meshes
- Procedural dust particles
- Saturn ring texture support
- Planet click selection with pointer hover
- Cinematic camera focus transitions
- Bloom and vignette postprocessing

The scene now supports higher visual polish with postprocessing, while still leaving room for additional shaders, atmosphere layers, and HDR workflow.

## Simulation And Physics

The app currently supports two frontend position modes:

- Kepler-style orbital position calculation in `frontend/lib/orbital.ts`
- Simplified N-body stepping in `frontend/lib/nbody.ts`

`SolarSystemScene` uses mutable refs for elapsed simulation days, galactic drift, and optional N-body state. Each frame:

- Advances elapsed days according to `timeScale`
- Applies cinematic galactic root motion
- Steps N-body state when enabled

`PlanetMesh` chooses its position from N-body state when available, otherwise from `orbitalPosition`.

The N-body solver supports:

- Mass ratios relative to Earth mass
- Sun gravity as a central acceleration
- Pairwise planet gravity
- Softening
- Euler-style integration

This provides a presentational N-body demo. It is not yet validated as a scientific or production-grade trajectory simulator.

## UX And Interaction

The frontend now includes:

- Clickable planets with selection state
- Pointer feedback on hover
- A bottom-left info panel for the selected planet
- NASA resource links and 3D model references
- Cinematic camera movement with ease-out transitions

The selected planet is stored in Zustand and used to drive follow target, camera focus, and UI state.

## API And Data Flow

The frontend API client lives in `frontend/lib/api.ts`.

Current API contract:

- `GET /planets`
- `GET /simulation/config`
- `POST /simulation/update`
- `GET /nasa/planets/{planet_name}`
- `GET /nasa/quota`
- `GET /nasa/earth-imagery`
- `GET /nasa/mars-rovers`

The client uses backend data when available and falls back to local bundled values when the API is unreachable. The UI shows a `Fallback` status when the backend cannot provide live config.

Current data flow:

1. `useSpaceData` initializes with fallback planets and config
2. It fetches backend planets and simulation config
3. It merges backend config with fallback values
4. It tracks whether data is live or fallback
5. Selected settings are written into Zustand
6. UI changes update Zustand and send `POST /simulation/update` best-effort

The frontend remains the primary render authority, while the backend serves config, planet constants, and NASA metadata.

## Backend Architecture

The backend is a FastAPI app with the following active modules:

- `backend/app/main.py`
- `backend/app/routers/planets.py`
- `backend/app/routers/simulation.py`
- `backend/app/routers/nasa.py`
- `backend/app/schemas/planet.py`
- `backend/app/schemas/simulation.py`
- `backend/app/services/planet_service.py`
- `backend/app/services/simulation_service.py`
- `backend/app/services/nasa_service.py`
- `backend/app/services/physics_service.py`

Current backend capabilities:

- Health endpoint at `/health`
- Planet constants from in-memory service
- Simulation config served and updated in memory
- Pydantic camelCase aliases for frontend compatibility
- Permissive CORS for local development
- NASA API integration and resource endpoints

The backend is still not a persistent authoritative simulation engine. It does not yet include a database, cache, task queue, auth, versioning, rate limiting, or structured telemetry.

## NASA Integration

A new backend service provides NASA-related functionality:

- NASA API quota validation
- NASA planetary resource metadata
- Earth imagery fetch endpoint
- Mars rover imagery fetch endpoint

The NASA API key has been validated and currently supports 4000 requests/day.

## Testing Coverage

Known test infrastructure:

- `frontend/vitest.config.ts`
- `frontend/vitest.setup.ts`
- `frontend/lib/orbital.test.ts`
- `frontend/lib/nbody.test.ts`
- `frontend/components/ui/ControlPanel.test.tsx`

Current verification state:

- Backend import validation succeeded in the local Python environment
- Backend dependencies were installed successfully
- Frontend lint command is available, and package dependencies are installed
- Full frontend test run has not been validated end-to-end yet

Existing gaps:

- No full backend Pytest suite is currently documented
- No Playwright or frontend E2E automation is present
- No performance benchmarks or regression tests are established

## Docker And Deployment

The repository includes:

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `traefik.yml`

Docker Compose is configured for local integration with frontend on port 3000 and backend on port 8000. It waits for backend health before starting the frontend.

This is a functional local deployment setup, but not a production-grade deployment pipeline.

## What Is Done

- Phase 1 contract stabilization mostly completed
- Backend/frontend config contract aligned for `gravityScale`
- API fallback behavior implemented and surfaced in the UI
- Clickable planets and planet selection added
- Cinematic camera transitions added
- Postprocessing (bloom + vignette) added
- NASA metadata backend service and routes added
- `CURRENT_STATE.md` and `IMPROVEMENT_ROADMAP.md` updated for phase tracking

## What Needs To Be Implemented

- Full NASA/JPL ephemeris integration
- Backend persistence layer (PostgreSQL or similar)
- Redis/HTTP caching for external API responses
- User/session and favorites support
- Backend trajectory/physics authority
- Simulation/renderer separation and backend-sourced trajectories
- CI/CD pipeline, E2E tests, and performance budgets
- Structured logging, metrics, and production observability

## Notes For Any Agent

To continue from here, a new agent should start with Phase 3 work:

1. Implement NASA/JPL data integration and caching
2. Add persistence for user sessions and planet favorites
3. Keep the current frontend/backed contract intact
4. Preserve existing Phase 2 visual/interaction behavior while refactoring backend authority

This file now documents the current run state and the next phase boundaries for seamless handoff.

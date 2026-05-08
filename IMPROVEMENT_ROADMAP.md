# Improvement Roadmap

## Roadmap Strategy

The best portfolio path is visible quality first, backed by architecture that prevents rework. Each phase preserves the current working simulation and increments toward a real data-backed, production-friendly platform.

1. Stabilize architecture and contracts.
2. Improve visuals and interaction.
3. Integrate real NASA/JPL data and caching.
4. Separate physics, render, and sync loops.
5. Add backend persistence, cache, and jobs.
6. Add CI/CD, testing, and performance budgets.

This roadmap is intended to let any agent continue from a clear phase boundary.

## Phase 1: Stabilize Architecture And Contracts

### Status: Completed

### Done

- Backend/frontend config contract aligned, including `gravityScale`.
- API fallback is surfaced in the UI rather than failing silently.
- Simulation config now uses camelCase aliases for frontend compatibility.
- Backend import validation is successful.
- Local API and fallback behavior are documented.

### Remaining

- Add wider API status diagnostics beyond the current `Fallback` indicator.
- Add explicit contract tests for schema versioning and fallback behavior.
- Clarify backend-synced vs frontend-only settings in the store.
- Harden error recovery for backend outages.

### Key Files

- `backend/app/schemas/simulation.py`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/hooks/useSpaceData.ts`
- `frontend/components/space/SolarSystemScene.tsx`

## Phase 2: Visual And Interaction Upgrade

### Status: Completed

### Done

- Added clickable planets with hover and selection handling.
- Added a planet info panel for selected bodies.
- Added cinematic camera transitions and smoother follow behavior.
- Added postprocessing effects with bloom and vignette.
- Added backend NASA resource endpoints and metadata routes.
- Updated frontend dependencies for postprocessing.

### Remaining

- Add in-app quality controls and performance profiles.
- Add atmosphere/cloud shader layers for Earth and gas giants.
- Add better visual feedback for selected mode and simulation state.
- Add adaptive quality settings for lower-end devices.

### Key Files

- `frontend/components/space/PlanetMesh.tsx`
- `frontend/components/space/SolarSystemScene.tsx`
- `frontend/components/space/PlanetInfoPanel.tsx`
- `frontend/components/space/CameraRig.tsx`
- `frontend/components/space/PostprocessingEffects.tsx`
- `backend/app/services/nasa_service.py`
- `backend/app/routers/nasa.py`

## Phase 3: Real NASA/JPL Data Integration & Backend Persistence

### Status: Next

### Mission

Move beyond static data and metadata by integrating real NASA/JPL ephemeris and persistence.

### Work to implement

- Add JPL Horizons or equivalent NASA/JPL ephemeris integration.
- Add persistent storage for planets and user sessions.
- Add caching for external API responses.
- Add user/session favorites support.
- Add structured backend logging and request metadata.

### Candidate Files

- `backend/app/services/jpl_service.py`
- `backend/app/services/cache_service.py`
- `backend/app/models/session.py`
- `backend/app/routers/sessions.py`
- `backend/app/db/models.py`
- `frontend/hooks/useSession.ts`
- `frontend/components/ui/SessionPanel.tsx`

## Phase 4: Simulation Engine Separation & Backend Authority

### Status: Next

### Mission

Separate the render loop from the physics loop and make backend trajectories the authoritative source of truth.

### Work to implement

- Add backend trajectory generation and caching endpoint.
- Add frontend trajectory consumer and render adapter.
- Keep frontend N-body as a fallback demo path.
- Add optional WebSocket sync for live collaboration.
- Add explicit timeline/date controls.

### Candidate Files

- `backend/app/routers/trajectories.py`
- `backend/app/services/trajectory_service.py`
- `frontend/hooks/useTrajectories.ts`
- `frontend/lib/render-adapter.ts`

## Phase 5: CI/CD, Testing, Performance Budgets

### Status: Future

### Mission

Add reliability and validation so the project can evolve safely and be deployed with confidence.

### Work to implement

- Add GitHub Actions or equivalent CI pipeline.
- Add lint/build/test checks for frontend and backend.
- Add Playwright E2E tests for critical flows.
- Add performance budgets for bundle size and API latency.
- Add monitoring and observability instrumentation.

### Candidate Files

- `.github/workflows/ci.yml`
- `frontend/vitest.config.ts`
- `frontend/playwright.config.ts`
- `backend/pytest.ini`
- `backend/requirements-dev.txt`

## Current Priorities

**Short term:**

1. Validate the Phase 2 build and deployment.
2. Confirm frontend npm/vitest behavior.
3. Add a small E2E smoke test for planet selection.

**Medium term:**

1. Start Phase 3 with NASA/JPL ephemeris.
2. Add persistent sessions and favorites.
3. Add caching for external API responses.

**Long term:**

1. Add backend trajectory precomputation.
2. Add CI/CD and automated tests.
3. Add performance budgeting and observability.

## Agent Continuation Notes

A new agent can continue from Phase 3 with a single prompt by following these steps:

1. Preserve current Phase 2 UI and backend behavior.
2. Implement NASA/JPL ephemeris or real astronomical data sources.
3. Add persistence and user/session support.
4. Add backend trajectory or simulation authority.
5. Add CI/CD and tests after Phase 3 and Phase 4 are stable.

Each phase is documented with "Done" and "Next" sections to make continuation seamless.

# Improvement Roadmap

## Roadmap Strategy

The best portfolio path is visible quality first, backed by architecture that prevents rework:

1. Stabilize architecture and contracts.
2. Improve visuals and interaction.
3. Integrate real NASA/JPL data.
4. Separate physics, render, and sync loops.
5. Add backend persistence, cache, and jobs.
6. Add testing, performance budgets, and CI/CD.

This roadmap intentionally avoids a full rewrite. Each phase preserves the current working simulation and upgrades one layer at a time.

## Phase 1: Stabilize Architecture And Contracts

### Analysis

The frontend and backend are already separated, but the frontend is the real authority for simulation behavior. The first contract mismatch around `gravityScale` has been fixed; the remaining immediate issue is preventing future drift as the platform grows.

### Problems Found

- `gravityScale` now round-trips through the backend config API.
- API fallback is now visible in the control panel, but richer diagnostics remain to be added.
- Simulation, rendering, and visual effects are coordinated from `SolarSystemScene`.
- Tests exist on the frontend but were not runnable in the current local environment.

### Proposed Architecture

- Define whether each setting is backend-synced or frontend-only.
- Add a small API status model to the frontend.
- Start extracting simulation mode selection behind a simulation adapter.
- Keep existing visual behavior unchanged.

### File-by-file Changes

- `backend/app/schemas/simulation.py`: add `gravity_scale` if it should be persisted by backend.
- `frontend/lib/types.ts`: keep config aligned with backend OpenAPI contract.
- `frontend/lib/api.ts`: return data plus status/error metadata instead of only fallback values.
- `frontend/hooks/useSpaceData.ts`: expose whether data came from API or fallback.
- `frontend/components/space/SolarSystemScene.tsx`: begin moving simulation stepping out of scene composition.

### Implementation

- Keep simulation config contract tests passing as new fields are added.
- Add API contract tests for config payloads.
- Expand the minimal data status indicator into clearer diagnostics and recovery guidance.
- Document current simulation units and scale assumptions.

### Tests

- Frontend Vitest for API fallback/status behavior.
- Backend Pytest for `/simulation/config` and `/simulation/update`.
- Contract tests proving camelCase simulation config fields round-trip.

### Performance Considerations

This phase should not change rendering cost.

### Future Extensibility Notes

Clear contracts make NASA data, sessions, and WebSocket simulation streaming much safer to add later.

## Phase 2: Visual And Interaction Upgrade

### Analysis

The current app is visually appealing but still uses basic materials and simple UI interactions. The fastest portfolio impact will come from cinematic rendering and direct exploration controls.

### Problems Found

- No postprocessing pipeline.
- No atmosphere/cloud shader stack.
- No clickable planets.
- Camera transitions are functional but not yet cinematic.
- Visual layers are fixed-cost.

### Proposed Architecture

- Add a rendering quality profile in state.
- Add object picking/selection at the planet mesh level.
- Add a postprocessing layer that can be disabled on lower quality.
- Add visual upgrades one planet/effect at a time.

### File-by-file Changes

- `frontend/components/space/PlanetMesh.tsx`: add click/hover selection behavior.
- `frontend/components/space/SolarSystemScene.tsx`: add postprocessing and quality-gated effect composition.
- `frontend/components/ui/ControlPanel.tsx`: add compact quality/visual controls if needed.
- New shader/effect modules under `frontend/components/space` or `frontend/lib/rendering`.

### Implementation

- Add planet click selection and hover affordance.
- Add smoother camera focus transitions.
- Add bloom for sun/emissive highlights.
- Add Earth atmosphere/cloud layer as the first high-quality planet upgrade.
- Add adaptive quality defaults for particle-heavy layers.

### Tests

- Control panel and store tests for quality toggles.
- Playwright smoke test to verify canvas renders and planet selection updates UI.

### Performance Considerations

- Keep bloom and atmosphere optional.
- Measure frame time before increasing particle counts.
- Avoid heavy shader work on all planets at once.

### Future Extensibility Notes

The same selection and info-panel flow will support moons, spacecraft, asteroids, and exoplanets.

## Phase 3: Real Astronomical Data Integration

### Analysis

The current data is static. Real NASA/JPL data will make the platform feel grounded and credible, but it needs backend caching to avoid slow, rate-limited frontend calls.

### Problems Found

- No external data source integration.
- No cache or persistence.
- No source attribution in UI.
- No normalized schema for rich celestial metadata.

### Proposed Architecture

- Backend owns external data integration.
- Add normalized celestial metadata APIs.
- Cache external responses.
- Frontend renders source-aware metadata panels.

### File-by-file Changes

- Backend: add data-provider service modules for NASA/JPL sources.
- Backend: add normalized schemas for metadata, imagery, and source attribution.
- Frontend: add metadata panels and loading/error states.
- Frontend: extend `Planet` or introduce separate `CelestialMetadata` types.

### Implementation

- Start with NASA APOD and NASA Image and Video Library for visible impact.
- Add JPL Horizons or cached ephemeris reference data after schema normalization.
- Add EPIC Earth imagery as an optional Earth detail panel feature.
- Add source attribution and timestamps in UI.

### Tests

- Backend tests with mocked NASA/JPL responses.
- Cache hit/miss tests.
- Frontend tests for loading, fallback, and source display.

### Performance Considerations

- Never block first render on external data.
- Cache backend responses.
- Lazy-load rich metadata panels.

### Future Extensibility Notes

The same provider pattern can support Exoplanet Archive, OpenSpace datasets, and NASA SVS references later.

## Phase 4: Simulation Engine Separation

### Analysis

The current simulation runs inside the render loop. This is acceptable for an interactive demo but not for deterministic replay, historical alignment playback, or backend-authoritative sessions.

### Problems Found

- Frame-dependent physics.
- No fixed timestep.
- No simulation history buffer.
- No shared interface for orbital vs N-body modes.

### Proposed Architecture

- Introduce a simulation engine interface.
- Use a fixed timestep accumulator.
- Render interpolated transforms.
- Keep backend sync optional and separate.

### File-by-file Changes

- `frontend/lib/orbital.ts`: wrap current orbital logic as one engine mode.
- `frontend/lib/nbody.ts`: wrap current N-body logic as another engine mode.
- New `frontend/lib/simulation-engine.ts`: engine interface and stepping coordinator.
- `SolarSystemScene`: consume transforms instead of owning physics logic directly.

### Implementation

- Add deterministic timestep stepping.
- Add transform snapshots for interpolation.
- Add velocity and acceleration vector data.
- Add tests for timestep determinism.

### Tests

- Unit tests for fixed timestep accumulator.
- Simulation correctness tests for orbital continuity.
- N-body energy drift sanity checks within documented tolerance.

### Performance Considerations

- Keep simulation object allocations low.
- Reuse vectors/buffers.
- Consider Web Worker physics after deterministic engine exists.

### Future Extensibility Notes

This structure enables rewind, future simulation, collision prediction, spacecraft insertion, and backend-authoritative sessions.

## Phase 5: Backend Platform Foundation

### Analysis

The backend needs to evolve from an in-memory service into a data and session platform, but this should happen after contracts and data needs are clearer.

### Problems Found

- No database.
- No cache.
- No background jobs.
- No sessions or saved worlds.
- No observability.

### Proposed Architecture

- PostgreSQL for durable entities.
- Redis for cache and rate-limiting support.
- Background worker for NASA/JPL refresh jobs.
- WebSocket endpoint for optional simulation/session streaming.
- API versioning under `/api/v1`.

### File-by-file Changes

- Add backend settings module for environment-driven config.
- Add database models/migrations when durable entities are introduced.
- Add cache service wrapper.
- Add versioned routers.
- Extend Compose with Postgres and Redis only when used.

### Implementation

- Add structured settings and environment examples first.
- Add Redis cache for external data.
- Add Postgres for saved worlds/profiles after UI needs them.
- Add WebSockets after frontend has a clean simulation sync boundary.

### Tests

- Pytest API tests.
- Integration tests for cache/provider behavior.
- WebSocket tests once streaming exists.

### Performance Considerations

- Cache slow external API calls.
- Keep simulation streaming payloads compact.
- Avoid database writes from high-frequency simulation loops.

### Future Extensibility Notes

This prepares the project for user accounts, saved missions, collaborative sessions, and analytics without forcing those features too early.

## Phase 6: Testing, Performance, And CI/CD

### Analysis

The project needs automated checks before major graphics, physics, and backend expansion.

### Problems Found

- Frontend tools were unavailable locally during audit.
- Backend has no tests.
- No e2e tests.
- No CI pipeline.
- No performance budgets.

### Proposed Architecture

- Vitest for frontend unit/component tests.
- Pytest for backend tests.
- Playwright for smoke/e2e and later visual regression.
- CI pipeline for lint, typecheck, tests, and builds.
- Lightweight performance benchmark for scene load and frame stability.

### File-by-file Changes

- Add backend test files under `backend/tests`.
- Add CI workflow under `.github/workflows`.
- Add documented setup commands to `README.md`.
- Add Playwright smoke tests under a frontend e2e folder.

### Implementation

- Make dependency install reproducible.
- Add backend smoke tests.
- Add frontend typecheck script if missing.
- Add CI for frontend lint/test/build and backend tests.
- Add Playwright canvas smoke test.

### Tests

- Unit, component, API, contract, e2e, and simulation correctness tests.
- Performance checks should start as reporting, then become budgets after baseline is stable.

### Performance Considerations

- Track FPS or frame time for representative scenes.
- Add adaptive quality before pushing advanced shaders to all devices.

### Future Extensibility Notes

CI and benchmarks will protect the project as NASA data, shaders, workers, and backend services are added.

## Deployment Path

### Near Term

- Keep Docker Compose for local full-stack validation.
- Support Vercel frontend plus hosted FastAPI backend if desired.
- Add `.env.example` files and production-safe CORS settings.

### Mid Term

- Add Railway/Fly.io deployment path for backend.
- Add managed Postgres/Redis when data integration needs them.
- Use CDN-friendly texture and image asset strategy.

### Later

- Add HTTPS/reverse proxy production config.
- Add observability dashboards.
- Add release checklist and migration process.

## Recommended Next Implementation Order

1. Expand backend/frontend tests around API status and config contracts.
2. Add clickable planets and smoother camera focus.
3. Add bloom/atmosphere as optional quality-gated effects.
4. Add NASA image/APOD metadata through cached backend providers.
5. Extract fixed timestep simulation engine.
6. Add Playwright smoke tests and CI.
7. Add persistence only when saved worlds/profiles are ready.

## Non-goals For The Next Pass

- Do not rewrite the whole app.
- Do not add authentication before user-owned data exists.
- Do not add PostgreSQL/Redis before there is a feature using them.
- Do not claim scientific accuracy until validation against trusted ephemeris data exists.
- Do not add expensive graphics effects without quality controls.

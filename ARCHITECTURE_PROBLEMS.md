# Architecture Problems

## Executive Summary

The project has a good foundation, but its current architecture still behaves like a frontend-led simulator with a lightweight backend. The biggest risks are contract drift, mixed render/physics responsibilities, silent failures, missing production infrastructure, and limited simulation validation.

These problems are solvable incrementally. No full rewrite is needed.

## Frontend Architecture

### Problems Found

- `SolarSystemScene` currently coordinates rendering, simulation time, cinematic root motion, N-body initialization, N-body stepping, and scene composition in one component.
- Zustand combines simulation state, camera/follow state, visual-layer preferences, and UI controls in one store.
- `PlanetMesh` knows about both orbital and N-body positioning, which couples renderable planet meshes to simulation mode selection.
- API fallback is now visible in the control panel, but detailed error recovery and developer diagnostics are still limited.
- Deep-space visual layers are useful, but there is no central quality/performance profile controlling particle counts or effects.

### Why It Matters

The current structure works for eight planets, but it will become hard to maintain when adding NASA data, spacecraft, missions, timeline controls, quality settings, or backend-authoritative simulation.

### Recommended Direction

- Split scene orchestration from simulation orchestration.
- Create a small simulation adapter interface that returns body transforms independent of render meshes.
- Split Zustand into focused slices or separate stores for simulation controls, camera/navigation, visual preferences, and data status.
- Expand visible API/data status beyond the current fallback badge into clearer diagnostics and recovery behavior.

### Tradeoffs

Keeping everything in the scene component is faster for small demos. Splitting responsibilities adds a little structure now but prevents expensive rewrites later.

## Backend Architecture

### Problems Found

- Planet data and simulation config are process-local in-memory values.
- There is no persistence layer.
- There is no cache layer for external astronomical data.
- There are no background refresh jobs.
- There is no API versioning.
- CORS allows all origins.
- There is no auth, user/session model, analytics, telemetry, rate limiting, or structured logging.
- Backend simulation is optional and not integrated into the frontend render state.

### Why It Matters

A public platform needs stable data, bounded API usage, observability, and predictable behavior across process restarts. The current backend resets config on restart and cannot safely support user profiles, saved worlds, NASA/JPL cache, or shared simulation sessions.

### Recommended Direction

- Add explicit API versioning before expanding contracts.
- Add PostgreSQL for durable canonical entities later.
- Add Redis or equivalent cache before external NASA/JPL API usage.
- Add structured logging, request IDs, and production-safe CORS configuration early.
- Treat backend-authoritative simulation as a separate mode with a clear sync contract.

### Tradeoffs

Adding PostgreSQL, Redis, and background workers too early can slow visible progress. The first backend step should be contract stabilization and observability, then data integration cache, then persistence.

## API Contracts And Typing

### Problems Found

- The initial `gravityScale` frontend/backend mismatch has been fixed by adding `gravity_scale` to backend simulation schemas and covering the camelCase contract with API tests.
- Frontend fallback merging hides missing backend fields.
- There is no shared generated client or schema validation boundary.

### Why It Matters

Contract drift creates bugs that are hard to see because the UI appears to work locally. As APIs grow for NASA data, sessions, and simulation streaming, this becomes a major source of regressions.

### Recommended Direction

- Add contract tests for simulation config request/response payloads.
- Consider generating frontend API types from OpenAPI after backend contracts stabilize.

### Tradeoffs

Generated clients add tooling overhead. For the next phase, a small set of contract tests may be enough.

## Simulation Loop

### Problems Found

- Physics time advances inside the R3F render frame.
- Physics step size depends on render delta and `timeScale`.
- N-body integration uses a simple Euler-style update.
- Render loop, physics loop, and state sync loop are not separated.
- There is no deterministic fixed timestep.
- There is no rewind/history model.
- There is no authoritative simulation state handoff from backend to frontend.

### Why It Matters

Frame-dependent physics can diverge across devices and frame rates. It also makes historical playback, future prediction, multiplayer-ready sync, and scientific validation harder.

### Recommended Direction

- Introduce a simulation engine abstraction with fixed timestep stepping.
- Keep render interpolation separate from physics stepping.
- Keep backend sync separate from both render and physics loops.
- Use the existing orbital and N-body modules behind a common interface before adding advanced models.

### Tradeoffs

Fixed timestep architecture is more code than the current direct `useFrame` approach, but it enables correctness, replayability, and performance tuning.

## Physics Accuracy

### Problems Found

- Orbital data is static and bundled, not sourced from NASA/JPL.
- N-body constants are scaled for visual behavior rather than documented physical units.
- Sun is modeled as a fixed central attractor, not a moving barycentric body.
- Planetary perturbations are simplified.
- No moons, spacecraft, barycenters, collision prediction, or orbital insertion model exists.
- No correctness tests compare results to known ephemeris data.

### Why It Matters

The app can be educational and visually convincing today, but claims of scientific realism require known data sources, documented units, and validation against trusted references.

### Recommended Direction

- Document current units and scaling clearly.
- Add simulation correctness tests for Kepler solver behavior and energy drift in N-body mode.
- Integrate JPL Horizons or cached ephemeris data as a reference layer before claiming high accuracy.
- Add moons and barycenters after the engine can handle body hierarchies cleanly.

### Tradeoffs

Full scientific accuracy can conflict with cinematic scale and user comprehension. The product should explicitly support visual scale and scientific scale modes.

## Rendering Pipeline And Performance

### Problems Found

- There is no postprocessing pipeline for bloom, tone mapping control, or cinematic effects.
- Planet rendering uses standard materials, not custom shaders for atmosphere/clouds/scattering.
- Textures are loaded directly from public assets without texture compression or streaming strategy.
- Visual particle counts are fixed rather than adaptive.
- There is no formal LOD system.
- There are no performance budgets or FPS telemetry.
- Mobile performance has not been verified.

### Why It Matters

The visual target is NASA/game-engine quality. That requires not only better shaders and effects, but also quality tiers and careful GPU budgeting.

### Recommended Direction

- Add adaptive quality settings before dramatically increasing effect cost.
- Add postprocessing incrementally, starting with bloom for sun/emissive highlights.
- Add planet atmosphere/cloud layers one body at a time.
- Add LOD and texture compression before scaling object counts.

### Tradeoffs

Cinematic effects can quickly harm performance. Quality tiers should arrive early so high-end visuals do not break average laptops or mobile devices.

## UX And Product Experience

### Problems Found

- Planets are selected from the panel, but meshes are not directly clickable.
- Information panel is useful but limited.
- No guided tours, timeline, mission mode, bookmarks, search, minimap, or spacecraft navigation exists.
- API/data status is not visible.
- Mobile layout is functional but not yet a dedicated exploration HUD.

### Why It Matters

A portfolio-grade platform should feel like an exploration product, not only a visualization canvas. Users need clear actions, context, and discovery paths.

### Recommended Direction

- Add clickable celestial objects.
- Add richer object details with source attribution.
- Add cinematic focus transitions.
- Add timeline controls before advanced historical playback.
- Add guided tours after core navigation feels polished.

### Tradeoffs

Mission mode and first-person navigation are exciting, but they should come after object selection, camera polish, and data panels are stable.

## Testing And Quality

### Problems Found

- Frontend tests exist but could not run locally because dependencies were not installed.
- Backend has no test suite.
- No API contract tests.
- No rendering regression tests.
- No e2e smoke test.
- No performance benchmark or FPS budget test.
- No CI pipeline runs lint/test/build automatically.

### Why It Matters

The project is growing across graphics, physics, APIs, and data. Without tests, regressions will be easy to introduce and hard to diagnose.

### Recommended Direction

- Ensure frontend dependencies install reproducibly.
- Add backend Pytest tests for health, planets, and simulation config.
- Add API contract tests around camelCase payloads.
- Add Playwright smoke test for app load and canvas visibility.
- Add lightweight simulation correctness tests before refactoring physics.

### Tradeoffs

Rendering regression tests can be brittle. Start with smoke tests and deterministic math tests, then add screenshot testing once visuals stabilize.

## Docker, Environment, And Dev Experience

### Problems Found

- Docker Compose is local-only and minimal.
- No `.env.example` files.
- No clear environment separation for development, staging, and production.
- Traefik config exists but is not integrated into the default compose flow.
- Frontend tooling was unavailable locally during audit, suggesting setup docs or dependency state need attention.

### Why It Matters

A portfolio platform should be easy for reviewers and contributors to run. Production deployment also needs explicit configuration boundaries.

### Recommended Direction

- Add environment examples and document required variables.
- Add a clean local setup checklist.
- Add CI checks for frontend lint/test/build and backend tests.
- Optimize Dockerfiles after the app stabilizes.

### Tradeoffs

DevOps work is less visible than visual polish, so prioritize just enough automation to keep changes safe.

## Security And Production Readiness

### Problems Found

- Permissive CORS.
- No rate limiting.
- No auth.
- No persisted users or saved worlds.
- No external API key management.
- No observability stack.
- No CSP/security headers strategy documented.

### Why It Matters

NASA/JPL integration and public deployment introduce rate limits, API keys, abuse risk, and operational debugging needs.

### Recommended Direction

- Restrict CORS by environment.
- Add rate limiting before public API exposure.
- Add structured logging and metrics before background jobs.
- Add auth only when user-specific features are ready.

### Tradeoffs

Authentication is not needed for the next visual/data milestone unless saved worlds or profiles are implemented.

## Highest Priority Problems

1. Render loop and physics loop are coupled.
2. API failures need richer diagnostics and recovery behavior.
3. Backend state is in-memory only.
4. Backend tests currently cover only the initial simulation config contract.
5. No adaptive visual quality/performance budget.
6. No external astronomical data ingestion or cache layer.

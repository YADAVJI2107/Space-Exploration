import { fallbackPlanets } from "@/lib/planet-data";
import {
  BASE_GRAVITY,
  buildMassRatios,
  initializeNBodyState,
  stepNBodyState
} from "@/lib/nbody";

describe("n-body physics", () => {
  it("initializes positions and velocities for each planet", () => {
    const sample = fallbackPlanets.slice(0, 3);
    const state = initializeNBodyState(sample, 0);

    sample.forEach((planet) => {
      expect(state.positions[planet.name]).toBeDefined();
      expect(state.velocities[planet.name]).toBeDefined();
    });
  });

  it("advances the system with gravity", () => {
    const sample = fallbackPlanets.slice(0, 4);
    const state = initializeNBodyState(sample, 0);
    const massRatios = buildMassRatios(sample);

    const start = state.positions[sample[0].name].clone();

    stepNBodyState({
      state,
      massRatios,
      deltaDays: 1,
      gravityConstant: BASE_GRAVITY * 1.5
    });

    const end = state.positions[sample[0].name];
    expect(end.distanceTo(start)).toBeGreaterThan(0);
  });
});

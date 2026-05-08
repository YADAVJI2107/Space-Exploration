import * as THREE from "three";
import { orbitalPosition, solveKepler } from "@/lib/orbital";
import { fallbackPlanets } from "@/lib/planet-data";

describe("orbital helpers", () => {
  it("solves Kepler's equation for circular orbits", () => {
    const meanAnomaly = 1.2345;
    expect(solveKepler(meanAnomaly, 0)).toBeCloseTo(meanAnomaly, 6);
  });

  it("matches the expected radius for circular motion", () => {
    const earth = fallbackPlanets.find((planet) => planet.name === "Earth");
    if (!earth) {
      throw new Error("Earth fixture missing");
    }

    const circular = { ...earth, eccentricity: 0 };
    const position = orbitalPosition(circular, 12, new THREE.Vector3());
    expect(position.length()).toBeCloseTo(circular.orbitRadius, 2);
  });
});

import * as THREE from "three";
import type { Planet } from "@/lib/types";

const TWO_PI = Math.PI * 2;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);

function normalizeRadians(value: number) {
  return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

export function solveKepler(meanAnomaly: number, eccentricity: number) {
  let eccentricAnomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const numerator =
      eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
    const denominator = 1 - eccentricity * Math.cos(eccentricAnomaly);
    eccentricAnomaly -= numerator / denominator;
  }

  return eccentricAnomaly;
}

export function orbitalPosition(
  planet: Planet,
  elapsedDays: number,
  target = new THREE.Vector3()
) {
  const meanAnomaly = normalizeRadians(
    THREE.MathUtils.degToRad(planet.phase + planet.orbitSpeed * elapsedDays)
  );
  const eccentricAnomaly = solveKepler(meanAnomaly, planet.eccentricity);
  const trueAnomaly =
    2 *
    Math.atan2(
      Math.sqrt(1 + planet.eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - planet.eccentricity) * Math.cos(eccentricAnomaly / 2)
    );

  // r = a(1 - e cos E) gives the correct varying orbital radius and speed.
  const orbitalRadius = planet.orbitRadius * (1 - planet.eccentricity * Math.cos(eccentricAnomaly));
  target.set(orbitalRadius * Math.cos(trueAnomaly), 0, orbitalRadius * Math.sin(trueAnomaly));

  target.applyAxisAngle(Y_AXIS, THREE.MathUtils.degToRad(planet.argumentOfPeriapsis));
  target.applyAxisAngle(X_AXIS, THREE.MathUtils.degToRad(planet.inclination));
  target.applyAxisAngle(Y_AXIS, THREE.MathUtils.degToRad(planet.longitudeOfAscendingNode));

  return target;
}

export function orbitalPathPoints(planet: Planet, samples = 384) {
  const points: THREE.Vector3[] = [];
  const periodDays = planet.siderealPeriodDays;

  for (let index = 0; index <= samples; index += 1) {
    points.push(orbitalPosition(planet, (periodDays * index) / samples).clone());
  }

  return points;
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits
  }).format(value);
}

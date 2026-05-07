"use client";

import * as THREE from "three";
import type { Planet } from "@/lib/types";
import { orbitalPosition } from "@/lib/orbital";

export const EARTH_MASS = 5.97237e24;
export const SUN_MASS_RATIO = 1.9885e30 / EARTH_MASS;
export const BASE_GRAVITY = 8.9e-7;
export const DEFAULT_SOFTENING = 0.08;

export interface NBodyState {
  positions: Record<string, THREE.Vector3>;
  velocities: Record<string, THREE.Vector3>;
  accelerations: Record<string, THREE.Vector3>;
  names: string[];
}

export function buildMassRatios(planets: Planet[]) {
  return planets.reduce<Record<string, number>>((accumulator, planet) => {
    accumulator[planet.name] = planet.mass / EARTH_MASS;
    return accumulator;
  }, {});
}

export function initializeNBodyState(planets: Planet[], elapsedDays: number): NBodyState {
  const positions: Record<string, THREE.Vector3> = {};
  const velocities: Record<string, THREE.Vector3> = {};
  const accelerations: Record<string, THREE.Vector3> = {};
  const names = planets.map((planet) => planet.name);
  const velocitySampleDays = 0.35;

  planets.forEach((planet) => {
    const position = orbitalPosition(planet, elapsedDays, new THREE.Vector3());
    const nextPosition = orbitalPosition(planet, elapsedDays + velocitySampleDays, new THREE.Vector3());
    const velocity = nextPosition.clone().sub(position).divideScalar(velocitySampleDays);

    positions[planet.name] = position;
    velocities[planet.name] = velocity;
    accelerations[planet.name] = new THREE.Vector3();
  });

  return { positions, velocities, accelerations, names };
}

export function stepNBodyState({
  state,
  massRatios,
  deltaDays,
  gravityConstant,
  sunMassRatio = SUN_MASS_RATIO,
  softening = DEFAULT_SOFTENING
}: {
  state: NBodyState;
  massRatios: Record<string, number>;
  deltaDays: number;
  gravityConstant: number;
  sunMassRatio?: number;
  softening?: number;
}) {
  const { names, positions, velocities, accelerations } = state;
  const direction = new THREE.Vector3();

  names.forEach((name) => {
    accelerations[name].set(0, 0, 0);
  });

  // Pairwise gravity accumulation is O(n²), which is acceptable for the current 8-10 body set.
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const position = positions[name];
    const acceleration = accelerations[name];

    direction.copy(position).multiplyScalar(-1);
    let distanceSq = direction.lengthSq() + softening;
    let invDistance = 1 / Math.sqrt(distanceSq);
    let invDistance3 = invDistance * invDistance * invDistance;
    acceleration.addScaledVector(direction, gravityConstant * sunMassRatio * invDistance3);

    for (let otherIndex = 0; otherIndex < names.length; otherIndex += 1) {
      if (otherIndex === index) {
        continue;
      }

      const otherName = names[otherIndex];
      direction.copy(positions[otherName]).sub(position);
      distanceSq = direction.lengthSq() + softening;
      invDistance = 1 / Math.sqrt(distanceSq);
      invDistance3 = invDistance * invDistance * invDistance;
      acceleration.addScaledVector(
        direction,
        gravityConstant * (massRatios[otherName] ?? 0) * invDistance3
      );
    }
  }

  names.forEach((name) => {
    velocities[name].addScaledVector(accelerations[name], deltaDays);
    positions[name].addScaledVector(velocities[name], deltaDays);
  });
}

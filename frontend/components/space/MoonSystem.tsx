"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { seededRandom } from "@/lib/seeded-random";
import { tuneBasicMaterialTexture } from "@/lib/three-texture";
import type { Planet } from "@/lib/types";

interface MoonSystemProps {
  planet: Planet;
  getElapsedDays: () => number;
}

interface MoonDescriptor {
  color: THREE.Color;
  inclination: number;
  orbitalRadius: number;
  orbitalPeriodDays: number;
  phase: number;
  scale: number;
}

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const scaleVector = new THREE.Vector3();
const MOON_ORBIT_AXIS = new THREE.Vector3(1, 0, 0);

export function MoonSystem({ planet, getElapsedDays }: MoonSystemProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const moonTexture = useTexture("/nasa/moon-apollo11.jpg") as THREE.Texture;

  const moons = useMemo(() => buildMoonDescriptors(planet), [planet]);

  useFrame(() => {
    const mesh = instancedRef.current;
    if (!mesh || moons.length === 0) {
      return;
    }

    const elapsedDays = getElapsedDays();

    for (let index = 0; index < moons.length; index += 1) {
      const moon = moons[index];
      const angle = moon.phase + (elapsedDays / moon.orbitalPeriodDays) * Math.PI * 2;
      position.set(
        Math.cos(angle) * moon.orbitalRadius,
        0,
        Math.sin(angle) * moon.orbitalRadius
      );
      position.applyAxisAngle(MOON_ORBIT_AXIS, moon.inclination);
      rotation.set(0, angle * 1.2, moon.inclination * 0.6);
      quaternion.setFromEuler(rotation);
      scaleVector.setScalar(moon.scale);
      matrix.compose(position, quaternion, scaleVector);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, moon.color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  if (moons.length === 0) {
    return null;
  }

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, moons.length]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial
        map={moonTexture}
        color="#d9dde6"
        roughness={0.92}
        metalness={0.01}
        emissive="#101319"
        emissiveIntensity={0.04}
        onUpdate={(material) => tuneBasicMaterialTexture(material.map)}
      />
    </instancedMesh>
  );
}

function buildMoonDescriptors(planet: Planet): MoonDescriptor[] {
  if (planet.moonCount <= 0) {
    return [];
  }

  const descriptors: MoonDescriptor[] = [];
  const baseRadius = planet.displayRadius * (planet.name === "Earth" ? 2.8 : planet.name === "Mars" ? 2.2 : 2.6);
  const spread = planet.displayRadius * (planet.name === "Earth" ? 1.4 : planet.name === "Mars" ? 1.8 : 8 + Math.log2(planet.moonCount + 1) * 2.2);
  const moonBaseScale =
    planet.name === "Earth" ? planet.displayRadius * 0.26 : planet.name === "Mars" ? planet.displayRadius * 0.14 : planet.displayRadius * 0.045;
  const fastInnerPeriod = planet.name === "Earth" ? 27.3 : planet.name === "Mars" ? 0.4 : 0.8;
  const outerPeriod = planet.name === "Earth" ? 27.3 : planet.name === "Mars" ? 1.3 : 160;

  for (let index = 0; index < planet.moonCount; index += 1) {
    const seed = index + planet.name.length * 97;
    const t = planet.moonCount === 1 ? 0 : index / Math.max(planet.moonCount - 1, 1);
    const orbitalRadius = baseRadius + Math.pow(t, 0.82) * spread + seededRandom(seed) * planet.displayRadius * 0.15;
    const orbitalPeriodDays =
      planet.moonCount === 1
        ? 27.3
        : fastInnerPeriod + Math.pow(t, 1.35) * (outerPeriod - fastInnerPeriod);
    const inclination = (seededRandom(seed + 1) - 0.5) * (planet.name === "Earth" ? 0.12 : 0.4);
    const phase = seededRandom(seed + 2) * Math.PI * 2;
    const scaleBoost = index < planet.featuredMoons.length ? 1.8 - index * 0.12 : 0.8 + seededRandom(seed + 3) * 0.55;
    const scale =
      planet.name === "Jupiter" || planet.name === "Saturn"
        ? moonBaseScale * scaleBoost
        : moonBaseScale * (planet.moonCount <= 2 ? 1.3 - index * 0.18 : scaleBoost);
    const shade = 0.72 + seededRandom(seed + 4) * 0.2;
    const color = new THREE.Color(shade, shade, shade + 0.03);

    descriptors.push({
      color,
      inclination,
      orbitalRadius,
      orbitalPeriodDays,
      phase,
      scale
    });
  }

  return descriptors;
}

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

interface MoonBand {
  color: string;
  innerRadius: number;
  outerRadius: number;
  opacity: number;
  rotation: [number, number, number];
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
  const bands = useMemo(() => buildMoonBands(planet), [planet]);

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

  if (moons.length === 0 && bands.length === 0) {
    return null;
  }

  return (
    <group>
      {bands.map((band, index) => (
        <mesh key={`${planet.name}-moon-band-${index}`} rotation={band.rotation}>
          <ringGeometry args={[band.innerRadius, band.outerRadius, 192]} />
          <meshBasicMaterial
            color={band.color}
            transparent
            opacity={band.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {moons.length > 0 ? (
        <instancedMesh ref={instancedRef} args={[undefined, undefined, moons.length]}>
          <sphereGeometry args={[1, 12, 12]} />
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
      ) : null}
    </group>
  );
}

function buildMoonDescriptors(planet: Planet): MoonDescriptor[] {
  if (planet.moonCount <= 0) {
    return [];
  }

  const descriptors: MoonDescriptor[] = [];
  const visibleMoonCount = getVisibleMoonCount(planet);
  const isGiant = planet.name === "Jupiter" || planet.name === "Saturn" || planet.name === "Uranus" || planet.name === "Neptune";
  const baseRadius = planet.displayRadius * (planet.name === "Earth" ? 4.4 : planet.name === "Mars" ? 3.6 : 4.8);
  const spread = planet.displayRadius * (planet.name === "Earth" ? 2.2 : planet.name === "Mars" ? 2.6 : 16 + Math.log2(planet.moonCount + 1) * 3.6);
  const moonBaseScale =
    planet.name === "Earth" ? planet.displayRadius * 0.24 : planet.name === "Mars" ? planet.displayRadius * 0.13 : planet.displayRadius * 0.026;
  const fastInnerPeriod = planet.name === "Earth" ? 27.3 : planet.name === "Mars" ? 0.4 : 0.8;
  const outerPeriod = planet.name === "Earth" ? 27.3 : planet.name === "Mars" ? 1.3 : 160;

  for (let index = 0; index < visibleMoonCount; index += 1) {
    const seed = index + planet.name.length * 97;
    const t = visibleMoonCount === 1 ? 0 : index / Math.max(visibleMoonCount - 1, 1);
    const orbitalRadius =
      baseRadius + Math.pow(t, 0.92) * spread + seededRandom(seed) * planet.displayRadius * (isGiant ? 0.55 : 0.22);
    const orbitalPeriodDays =
      planet.moonCount === 1
        ? 27.3
        : fastInnerPeriod + Math.pow(t, 1.35) * (outerPeriod - fastInnerPeriod);
    const inclination = (seededRandom(seed + 1) - 0.5) * (planet.name === "Earth" ? 0.12 : 0.4);
    const phase = seededRandom(seed + 2) * Math.PI * 2;
    const scaleBoost = index < planet.featuredMoons.length ? 2.2 - index * 0.14 : 0.65 + seededRandom(seed + 3) * 0.38;
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

function getVisibleMoonCount(planet: Planet) {
  if (planet.name === "Jupiter") {
    return 28;
  }
  if (planet.name === "Saturn") {
    return 34;
  }
  if (planet.name === "Uranus") {
    return 18;
  }
  if (planet.name === "Neptune") {
    return 12;
  }
  return planet.moonCount;
}

function buildMoonBands(planet: Planet): MoonBand[] {
  if (planet.moonCount <= getVisibleMoonCount(planet)) {
    return [];
  }

  const base = planet.displayRadius * 4.8;
  const spread = planet.displayRadius * (16 + Math.log2(planet.moonCount + 1) * 3.6);
  return [
    {
      color: "#aab4c4",
      innerRadius: base + spread * 0.28,
      outerRadius: base + spread * 0.3,
      opacity: 0.08,
      rotation: [Math.PI / 2, 0.08, 0]
    },
    {
      color: "#cbd5e1",
      innerRadius: base + spread * 0.64,
      outerRadius: base + spread * 0.66,
      opacity: 0.06,
      rotation: [Math.PI / 2, -0.1, 0.16]
    }
  ];
}

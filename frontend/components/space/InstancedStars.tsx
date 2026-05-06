"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/store";

interface InstancedStarsProps {
  count: number;
  radius: number;
  depth: number;
  parallax: number;
  size: number;
  warm?: boolean;
}

const matrix = new THREE.Matrix4();
const color = new THREE.Color();

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function InstancedStars({ count, radius, depth, parallax, size, warm }: InstancedStarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, index) => {
      const seed = index + count * 13 + radius * 7 + depth * 3 + parallax * 101;
      const angle = seededRandom(seed) * Math.PI * 2;
      const band = (seededRandom(seed + 1) - 0.5) * 0.34;
      const distance = radius * (0.42 + seededRandom(seed + 2) * 0.58);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance + (seededRandom(seed + 3) - 0.5) * depth;
      const y = band * distance + (seededRandom(seed + 4) - 0.5) * radius * 0.7;
      const scale = size * (0.65 + seededRandom(seed + 5) * 2.6);
      const brightness = 0.62 + seededRandom(seed + 6) * 0.38;
      const hueShift = warm
        ? 0.09 + seededRandom(seed + 7) * 0.04
        : 0.55 + seededRandom(seed + 8) * 0.08;

      return {
        id: index,
        position: new THREE.Vector3(x, y, z),
        scale,
        color: new THREE.Color().setHSL(hueShift, warm ? 0.45 : 0.22, brightness)
      };
    });
  }, [count, depth, parallax, radius, size, warm]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    stars.forEach((star, index) => {
      matrix.makeScale(star.scale, star.scale, star.scale);
      matrix.setPosition(star.position);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.copy(star.color));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [stars]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const { isPaused, timeScale } = useSimulationStore.getState();
    if (!isPaused) {
      group.position.z = (group.position.z + delta * timeScale * 0.018 * parallax) % depth;
      group.rotation.y += delta * 0.0009 * parallax;
      group.rotation.x = Math.sin(group.position.z * 0.006) * 0.018;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial vertexColors toneMapped={false} transparent opacity={0.92} />
      </instancedMesh>
    </group>
  );
}

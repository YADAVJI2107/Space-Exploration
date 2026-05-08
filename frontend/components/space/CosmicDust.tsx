"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { seededRandom } from "@/lib/seeded-random";

interface CosmicDustProps {
  count?: number;
  radius?: number;
}

export function CosmicDust({ count = 1200, radius = 55 }: CosmicDustProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const spriteTexture = useTexture("/sprites/soft-disc.svg") as THREE.Texture;

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const seed = index + count * 3 + radius * 17;
      const r = radius * Math.cbrt(seededRandom(seed));
      const theta = seededRandom(seed + 1) * Math.PI * 2;
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1);
      positions[index * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = r * Math.cos(phi);
      positions[index * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.004;
      pointsRef.current.rotation.x += delta * 0.0015;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        sizeAttenuation
        map={spriteTexture}
        alphaMap={spriteTexture}
        alphaTest={0.08}
        color="#f8fafc"
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

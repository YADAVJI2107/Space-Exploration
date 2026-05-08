"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { tuneStandardMaterial } from "@/lib/three-texture";

interface SaturnRingSystemProps {
  radius: number;
  textureUrl: string;
  opacityScale?: number;
}

const RING_BANDS = [
  { inner: 1.18, outer: 1.34, color: "#8d8068", opacity: 0.12 },
  { inner: 1.38, outer: 1.68, color: "#d8c08b", opacity: 0.32 },
  { inner: 1.69, outer: 1.88, color: "#f0d7a0", opacity: 0.44 },
  { inner: 2.01, outer: 2.23, color: "#c2af86", opacity: 0.28 },
  { inner: 2.25, outer: 2.42, color: "#ead8b4", opacity: 0.18 },
  { inner: 2.44, outer: 2.56, color: "#b8aa95", opacity: 0.09 }
];

const RING_GAPS = [
  { inner: 1.34, outer: 1.38, opacity: 0.28 },
  { inner: 1.89, outer: 2, opacity: 0.54 },
  { inner: 2.29, outer: 2.32, opacity: 0.32 }
];

export function SaturnRingSystem({ radius, textureUrl, opacityScale = 1 }: SaturnRingSystemProps) {
  const texture = useTexture(textureUrl) as THREE.Texture;

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <ringGeometry args={[radius * 1.14, radius * 2.58, 384]} />
        <meshStandardMaterial
          map={texture}
          color="#e6d0a2"
          transparent
          opacity={0.18 * opacityScale}
          side={THREE.DoubleSide}
          roughness={0.98}
          metalness={0}
          alphaTest={0.025}
          depthWrite={false}
          onUpdate={tuneStandardMaterial}
        />
      </mesh>

      {RING_BANDS.map((band) => (
        <mesh key={`${band.inner}-${band.outer}`} receiveShadow>
          <ringGeometry args={[radius * band.inner, radius * band.outer, 384]} />
          <meshBasicMaterial
            color={band.color}
            transparent
            opacity={band.opacity * opacityScale}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {RING_GAPS.map((gap) => (
        <mesh key={`${gap.inner}-${gap.outer}`}>
          <ringGeometry args={[radius * gap.inner, radius * gap.outer, 384]} />
          <meshBasicMaterial
            color="#02030a"
            transparent
            opacity={gap.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

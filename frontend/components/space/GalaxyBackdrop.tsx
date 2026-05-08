"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { seededRandom } from "@/lib/seeded-random";
import { tuneBasicMaterialTexture } from "@/lib/three-texture";

interface GalaxyBackdropProps {
  starCount?: number;
  radius?: number;
  arms?: number;
  thickness?: number;
}

export function GalaxyBackdrop({
  starCount = 5200,
  radius = 180,
  arms = 4,
  thickness = 18
}: GalaxyBackdropProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const galaxyPlaneRef = useRef<THREE.Mesh>(null);
  const spriteTexture = useTexture("/sprites/soft-disc.svg") as THREE.Texture;
  const galaxyTexture = useTexture("/nasa/spiral-galaxy-ngc3147.jpg") as THREE.Texture;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const coreColor = new THREE.Color("#f8fafc");
    const rimColor = new THREE.Color("#7aa4c9");

    for (let index = 0; index < starCount; index += 1) {
      const seed = index + starCount * 7 + radius * 3;
      const arm = index % arms;
      const distance = Math.pow(seededRandom(seed), 0.55) * radius;
      const armOffset = (arm * (Math.PI * 2)) / arms;
      const swirl = distance * 0.045 + (seededRandom(seed + 1) - 0.5) * 0.4;
      const angle = armOffset + swirl;
      const height = (seededRandom(seed + 2) - 0.5) * thickness * (1 - distance / radius);

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = height;

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;

      const color = coreColor.clone().lerp(rimColor, distance / radius);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [arms, radius, starCount, thickness]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.004;
    }
    if (galaxyPlaneRef.current) {
      galaxyPlaneRef.current.rotation.z += delta * 0.0016;
    }
  });

  return (
    <group rotation={[0.08, 0, 0]}>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.48}
          sizeAttenuation
          map={spriteTexture}
          alphaMap={spriteTexture}
          alphaTest={0.08}
          vertexColors
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh
        ref={galaxyPlaneRef}
        position={[0, -19, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[112, 112, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={galaxyTexture}
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          onUpdate={(material) => tuneBasicMaterialTexture(material.map)}
        />
      </mesh>

      <mesh position={[0, -18.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[30, 68, 192]} />
        <meshBasicMaterial
          color="#5f84be"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface NebulaFieldProps {
  cloudCount?: number;
  particleCount?: number;
  radius?: number;
}

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function NebulaField({
  cloudCount = 6,
  particleCount = 1800,
  radius = 140
}: NebulaFieldProps) {
  const particleRef = useRef<THREE.Points>(null);
  const cloudRef = useRef<THREE.Group>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseColor = new THREE.Color("#7dd3fc");
    const accentColor = new THREE.Color("#c084fc");

    for (let index = 0; index < particleCount; index += 1) {
      const seed = index + particleCount * 11 + radius * 5;
      const u = seededRandom(seed);
      const v = seededRandom(seed + 1);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.35 + seededRandom(seed + 2) * 0.65);

      positions[index * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = r * Math.cos(phi);
      positions[index * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const color = baseColor.clone().lerp(accentColor, seededRandom(seed + 3));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, [particleCount, radius]);

  const clouds = useMemo(
    () =>
      Array.from({ length: cloudCount }, (_, index) => {
        const seed = index + cloudCount * 9 + radius * 2.3;
        const angle = (index / cloudCount) * Math.PI * 2;
        const dist = radius * (0.35 + seededRandom(seed) * 0.4);
        return {
          position: new THREE.Vector3(
            Math.cos(angle) * dist,
            (seededRandom(seed + 1) - 0.5) * radius * 0.2,
            Math.sin(angle) * dist
          ),
          scale: 12 + seededRandom(seed + 2) * 16,
          color: index % 2 === 0 ? "#7c3aed" : "#0ea5e9",
          opacity: 0.08 + seededRandom(seed + 3) * 0.08
        };
      }),
    [cloudCount, radius]
  );

  useFrame((_, delta) => {
    if (particleRef.current) {
      particleRef.current.rotation.y -= delta * 0.01;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <group>
      <points ref={particleRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <group ref={cloudRef}>
        {clouds.map((cloud, index) => (
          <mesh key={`nebula-cloud-${index}`} position={cloud.position} scale={cloud.scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
              color={cloud.color}
              transparent
              opacity={cloud.opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

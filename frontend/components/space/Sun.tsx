"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useSimulationStore } from "@/lib/store";
import { tuneStandardMaterial } from "@/lib/three-texture";

export function Sun() {
  const texture = useTexture("/textures/2k_sun.jpg") as THREE.Texture;
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const { isPaused, timeScale } = useSimulationStore.getState();
    if (!isPaused && sunRef.current) {
      sunRef.current.rotation.y += delta * 0.013 * (timeScale / 45);
    }

    if (glowRef.current) {
      const pulse = 1 + Math.sin(performance.now() * 0.0012) * 0.018;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <pointLight
        castShadow
        intensity={550}
        distance={180}
        decay={1.7}
        color="#fff2c7"
        shadow-mapSize={[2048, 2048]}
      />
      <mesh ref={glowRef} scale={1.5}>
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshBasicMaterial color="#f8b84f" transparent opacity={0.16} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={sunRef}>
        <sphereGeometry args={[2.45, 96, 96]} />
        <meshStandardMaterial
          map={texture}
          color="#fff0bf"
          emissive="#ffb13d"
          emissiveIntensity={2.8}
          roughness={0.65}
          toneMapped={false}
          onUpdate={tuneStandardMaterial}
        />
      </mesh>
    </group>
  );
}

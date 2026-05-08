"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { orbitalPosition } from "@/lib/orbital";
import { useSimulationStore } from "@/lib/store";
import { tuneStandardMaterial } from "@/lib/three-texture";
import type { Planet } from "@/lib/types";

interface PlanetMeshProps {
  planet: Planet;
  getElapsedDays: () => number;
  registerPlanet: (name: string, object: THREE.Object3D | null) => void;
  nBodyStateRef?: RefObject<{ positions: Record<string, THREE.Vector3> } | null>;
}

const scratchPosition = new THREE.Vector3();

export function PlanetMesh({ planet, getElapsedDays, registerPlanet, nBodyStateRef }: PlanetMeshProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(planet.textureUrl) as THREE.Texture;
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const isSelected = selectedPlanet === planet.name;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.userData.displayRadius = planet.displayRadius;
    registerPlanet(planet.name, root);

    return () => registerPlanet(planet.name, null);
  }, [planet.displayRadius, planet.name, registerPlanet]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const nBodyEnabled = useSimulationStore.getState().nBodyEnabled;
    const nBodyPosition = nBodyEnabled ? nBodyStateRef?.current?.positions[planet.name] : null;
    if (nBodyPosition) {
      root.position.copy(nBodyPosition);
    } else {
      root.position.copy(orbitalPosition(planet, getElapsedDays(), scratchPosition));
    }

    const { isPaused, timeScale } = useSimulationStore.getState();
    if (!isPaused && bodyRef.current) {
      bodyRef.current.rotation.y += delta * timeScale * planet.rotationSpeed * Math.PI * 2;
    }

    if (haloRef.current) {
      const haloScale = isSelected ? 1 + Math.sin(performance.now() * 0.004) * 0.04 : 0.001;
      haloRef.current.scale.setScalar(haloScale);
      haloRef.current.visible = isSelected;
    }
  });

  return (
    <group ref={rootRef}>
      <group rotation={[0, 0, THREE.MathUtils.degToRad(planet.axialTilt)]}>
        <mesh ref={bodyRef} castShadow receiveShadow>
          <sphereGeometry args={[planet.displayRadius, 64, 64]} />
          <meshStandardMaterial
            map={texture}
            color={planet.color}
            roughness={0.82}
            metalness={0.03}
            emissive={planet.name === "Earth" ? "#061733" : "#000000"}
            emissiveIntensity={planet.name === "Earth" ? 0.05 : 0}
            onUpdate={tuneStandardMaterial}
          />
        </mesh>

        {planet.hasRings && planet.ringTextureUrl ? (
          <SaturnRings radius={planet.displayRadius} textureUrl={planet.ringTextureUrl} />
        ) : null}
      </group>

      <mesh ref={haloRef} visible={isSelected}>
        <sphereGeometry args={[planet.displayRadius * 1.18, 48, 48]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.12} wireframe />
      </mesh>

      {isSelected ? (
        <Html
          distanceFactor={10}
          position={[0, planet.displayRadius * 1.65, 0]}
          center
          zIndexRange={[5, 0]}
        >
          <div className="hidden rounded border border-cyan-200/30 bg-slate-950/70 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-100 backdrop-blur md:block">
            {planet.name}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function SaturnRings({ radius, textureUrl }: { radius: number; textureUrl: string }) {
  const texture = useTexture(textureUrl) as THREE.Texture;

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[radius * 1.35, radius * 2.38, 192]} />
      <meshStandardMaterial
        map={texture}
        color="#f1dca8"
        transparent
        opacity={0.92}
        side={THREE.DoubleSide}
        roughness={0.92}
        onUpdate={tuneStandardMaterial}
      />
    </mesh>
  );
}

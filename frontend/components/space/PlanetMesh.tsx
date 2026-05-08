"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import { orbitalPosition, visibleRotationDaysPerSecond } from "@/lib/orbital";
import { useSimulationStore } from "@/lib/store";
import { tuneStandardMaterial } from "@/lib/three-texture";
import type { Planet } from "@/lib/types";
import { MoonSystem } from "@/components/space/MoonSystem";
import { OrbitalInfrastructure } from "@/components/space/OrbitalInfrastructure";
import { SaturnRingSystem } from "@/components/space/SaturnRingSystem";

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
  const selectPlanet = useSimulationStore((state) => state.selectPlanet);
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
      const visualDaysPerSecond = visibleRotationDaysPerSecond(timeScale);
      bodyRef.current.rotation.y += delta * visualDaysPerSecond * planet.rotationSpeed * Math.PI * 2;
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
        <mesh
          ref={bodyRef}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            selectPlanet(planet.name);
          }}
          onPointerEnter={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[planet.displayRadius, 64, 64]} />
          <meshStandardMaterial
            map={texture}
            color={planet.color}
            roughness={planet.name === "Earth" ? 0.72 : 0.86}
            metalness={0.02}
            emissive={planet.name === "Earth" ? "#0a2748" : planet.name === "Neptune" ? "#102a52" : "#000000"}
            emissiveIntensity={planet.name === "Earth" ? 0.08 : planet.name === "Neptune" ? 0.05 : 0}
            onUpdate={tuneStandardMaterial}
          />
        </mesh>

        {planet.hasRings && planet.ringTextureUrl ? (
          <SaturnRingSystem radius={planet.displayRadius} textureUrl={planet.ringTextureUrl} />
        ) : null}

        <PlanetAtmosphere planet={planet} />
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

      <MoonSystem planet={planet} getElapsedDays={getElapsedDays} />
      {isSelected ? <OrbitalInfrastructure planet={planet} /> : null}
    </group>
  );
}

function PlanetAtmosphere({ planet }: { planet: Planet }) {
  const atmosphereColor =
    planet.name === "Earth"
      ? "#6fd7ff"
      : planet.name === "Venus"
        ? "#ffd39c"
        : planet.name === "Neptune"
          ? "#78a9ff"
          : planet.name === "Uranus"
            ? "#9be7ef"
            : null;

  if (!atmosphereColor) {
    return null;
  }

  return (
    <mesh scale={1.05}>
      <sphereGeometry args={[planet.displayRadius, 48, 48]} />
      <meshBasicMaterial
        color={atmosphereColor}
        transparent
        opacity={0.08}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

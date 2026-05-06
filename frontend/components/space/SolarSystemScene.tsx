"use client";

import { OrbitControls, PerspectiveCamera, Preload } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CameraRig } from "@/components/space/CameraRig";
import { InstancedStars } from "@/components/space/InstancedStars";
import { OrbitPath } from "@/components/space/OrbitPath";
import { PlanetMesh } from "@/components/space/PlanetMesh";
import { Sun } from "@/components/space/Sun";
import { useSimulationStore } from "@/lib/store";
import type { Planet, SimulationConfig } from "@/lib/types";

interface SolarSystemSceneProps {
  planets: Planet[];
  config: SimulationConfig;
}

export function SolarSystemScene({ planets, config }: SolarSystemSceneProps) {
  const systemRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetObjects = useRef<Record<string, THREE.Object3D>>({});
  const elapsedDays = useRef(0);
  const galacticProgress = useRef(0);
  const showOrbits = useSimulationStore((state) => state.showOrbits);

  const registerPlanet = useCallback((name: string, object: THREE.Object3D | null) => {
    if (!object) {
      delete planetObjects.current[name];
      return;
    }

    planetObjects.current[name] = object;
  }, []);

  const getElapsedDays = useCallback(() => elapsedDays.current, []);

  const sortedPlanets = useMemo(
    () => [...planets].sort((a, b) => a.orbitRadius - b.orbitRadius),
    [planets]
  );

  useFrame((_, delta) => {
    const { isPaused, timeScale } = useSimulationStore.getState();

    if (!isPaused) {
      elapsedDays.current += delta * timeScale;
      galacticProgress.current += delta * config.galacticSpeed * (timeScale / 45);
    }

    if (!systemRef.current) {
      return;
    }

    const progress = galacticProgress.current;
    systemRef.current.position.set(
      Math.sin(progress * 0.21) * 1.25,
      Math.sin(progress * 0.13) * 0.42,
      -progress * 8.5
    );

    // The root transform gives the system a slow galactic-arc drift while
    // individual planet positions remain governed by local orbital elements.
    systemRef.current.rotation.y = progress * 0.028;
    systemRef.current.rotation.z = Math.sin(progress * 0.11) * 0.018;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 14, 31]} fov={55} near={0.02} far={1400} />

      <ambientLight intensity={0.055} />
      <InstancedStars count={4200} radius={155} depth={230} parallax={0.35} size={0.018} />
      <InstancedStars count={1800} radius={95} depth={150} parallax={0.85} size={0.012} warm />

      <group ref={systemRef}>
        <Sun />

        {showOrbits &&
          sortedPlanets.map((planet) => <OrbitPath key={planet.name} planet={planet} />)}

        {sortedPlanets.map((planet) => (
          <PlanetMesh
            key={planet.name}
            planet={planet}
            getElapsedDays={getElapsedDays}
            registerPlanet={registerPlanet}
          />
        ))}
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.85}
        panSpeed={0.65}
        minDistance={1.3}
        maxDistance={190}
        target={[0, 0, 0]}
      />

      <CameraRig controlsRef={controlsRef} planetObjects={planetObjects} systemRef={systemRef} />
      <Preload all />
    </>
  );
}

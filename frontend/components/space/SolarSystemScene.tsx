"use client";

import { OrbitControls, PerspectiveCamera, Preload } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CameraRig } from "@/components/space/CameraRig";
import { CosmicDust } from "@/components/space/CosmicDust";
import { GalaxyBackdrop } from "@/components/space/GalaxyBackdrop";
import { InstancedStars } from "@/components/space/InstancedStars";
import { NebulaField } from "@/components/space/NebulaField";
import { OrbitPath } from "@/components/space/OrbitPath";
import { PlanetMesh } from "@/components/space/PlanetMesh";
import { Sun } from "@/components/space/Sun";
import {
  BASE_GRAVITY,
  buildMassRatios,
  initializeNBodyState,
  stepNBodyState
} from "@/lib/nbody";
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
  const nBodyStateRef = useRef<ReturnType<typeof initializeNBodyState> | null>(null);
  const lastNBodyEnabled = useRef(false);
  const lastPlanetKey = useRef("");
  const showOrbits = useSimulationStore((state) => state.showOrbits);
  const showGalaxy = useSimulationStore((state) => state.showGalaxy);
  const showNebula = useSimulationStore((state) => state.showNebula);
  const showDust = useSimulationStore((state) => state.showDust);

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
  const planetKey = useMemo(
    () => sortedPlanets.map((planet) => planet.name).join("|"),
    [sortedPlanets]
  );

  const massRatios = useMemo(() => buildMassRatios(sortedPlanets), [sortedPlanets]);
  const gravitationalScale = config.gravitationalConstant / 6.6743e-11;

  useFrame((_, delta) => {
    const { isPaused, timeScale, nBodyEnabled, gravityScale } = useSimulationStore.getState();

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

    if (nBodyEnabled) {
      if (
        !nBodyStateRef.current ||
        !lastNBodyEnabled.current ||
        planetKey !== lastPlanetKey.current
      ) {
        nBodyStateRef.current = initializeNBodyState(sortedPlanets, elapsedDays.current);
      }

      if (!isPaused && nBodyStateRef.current) {
        const deltaDays = delta * timeScale;
        const gravityConstant = BASE_GRAVITY * gravitationalScale * gravityScale;

        stepNBodyState({
          state: nBodyStateRef.current,
          massRatios,
          deltaDays,
          gravityConstant
        });
      }
    }

    lastNBodyEnabled.current = nBodyEnabled;
    lastPlanetKey.current = planetKey;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 14, 31]} fov={55} near={0.02} far={1400} />

      <fog attach="fog" args={["#02030a", 45, 220]} />
      <ambientLight intensity={0.055} />
      <hemisphereLight intensity={0.08} color="#dbeafe" groundColor="#020617" />
      {showGalaxy ? <GalaxyBackdrop /> : null}
      {showNebula ? <NebulaField /> : null}
      {showDust ? <CosmicDust /> : null}
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
            nBodyStateRef={nBodyStateRef}
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

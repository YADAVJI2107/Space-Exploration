"use client";

import { OrbitControls, PerspectiveCamera, Preload } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CameraRig } from "@/components/space/CameraRig";
import { CosmicDust } from "@/components/space/CosmicDust";
import { ExplorationNeighborhood } from "@/components/space/ExplorationNeighborhood";
import { GalaxyBackdrop } from "@/components/space/GalaxyBackdrop";
import { GalacticMotionView } from "@/components/space/GalacticMotionView";
import { InstancedStars } from "@/components/space/InstancedStars";
import { NebulaField } from "@/components/space/NebulaField";
import { OrbitPath } from "@/components/space/OrbitPath";
import { PostprocessingEffects } from "@/components/space/PostprocessingEffects";
import { PlanetMesh } from "@/components/space/PlanetMesh";
import { PlanetStudio } from "@/components/space/PlanetStudio";
import { Sun } from "@/components/space/Sun";
import { explorationDestinationMap } from "@/lib/exploration-data";
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
  const galacticFrameRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetObjects = useRef<Record<string, THREE.Object3D>>({});
  const destinationObjects = useRef<Record<string, THREE.Object3D>>({});
  const elapsedDays = useRef(0);
  const galacticProgress = useRef(0);
  const nBodyStateRef = useRef<ReturnType<typeof initializeNBodyState> | null>(null);
  const lastNBodyEnabled = useRef(false);
  const lastPlanetKey = useRef("");
  const showOrbits = useSimulationStore((state) => state.showOrbits);
  const showGalaxy = useSimulationStore((state) => state.showGalaxy);
  const showNebula = useSimulationStore((state) => state.showNebula);
  const showDust = useSimulationStore((state) => state.showDust);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);

  const registerPlanet = useCallback((name: string, object: THREE.Object3D | null) => {
    if (!object) {
      delete planetObjects.current[name];
      return;
    }

    planetObjects.current[name] = object;
  }, []);

  const registerDestination = useCallback((name: string, object: THREE.Object3D | null) => {
    if (!object) {
      delete destinationObjects.current[name];
      return;
    }

    destinationObjects.current[name] = object;
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
  const solarSystemBase = explorationDestinationMap["solar-system"].position;
  const activePlanet = useMemo(
    () => sortedPlanets.find((planet) => planet.name === selectedPlanet) ?? sortedPlanets[2] ?? null,
    [selectedPlanet, sortedPlanets]
  );

  useFrame((_, delta) => {
    if (viewMode === "planet") {
      return;
    }

    const { isPaused, timeScale, nBodyEnabled, gravityScale } = useSimulationStore.getState();

    if (!isPaused) {
      elapsedDays.current += delta * timeScale;
      galacticProgress.current += delta * config.galacticSpeed * Math.pow(timeScale / 8, 0.35);
    }

    if (!systemRef.current || !galacticFrameRef.current) {
      return;
    }

    const progress = galacticProgress.current;
    const orbitalPhase = progress * 0.085;
    const systemX = solarSystemBase[0] + Math.sin(orbitalPhase) * 7;
    const systemY = solarSystemBase[1] + Math.sin(progress * 0.042) * 0.4;
    const systemZ = solarSystemBase[2] + (1 - Math.cos(orbitalPhase)) * 18 - 8;
    const tangentYaw = Math.atan2(Math.cos(orbitalPhase) * 7, Math.sin(orbitalPhase) * 18);

    systemRef.current.position.set(systemX, systemY, systemZ);
    systemRef.current.rotation.y = tangentYaw * 0.06;
    systemRef.current.rotation.z = Math.sin(progress * 0.05) * 0.007;

    galacticFrameRef.current.position.set(0, Math.sin(progress * 0.03) * 0.8, 0);
    galacticFrameRef.current.rotation.y = progress * 0.0024;

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

  if (viewMode === "planet") {
    return (
      <>
        <PerspectiveCamera makeDefault position={[0, 1.7, 12]} fov={42} near={0.02} far={160} />
        <PlanetStudio planet={activePlanet} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.72}
          zoomSpeed={0.78}
          panSpeed={0.32}
          minDistance={4}
          maxDistance={24}
          target={[0, 0, 0]}
        />
        <Preload all />
      </>
    );
  }

  if (viewMode === "galactic") {
    return (
      <>
        <PerspectiveCamera makeDefault position={[0, 112, 218]} fov={46} near={0.1} far={2400} />
        <fog attach="fog" args={["#030712", 190, 980]} />
        <color attach="background" args={["#02030a"]} />
        {showGalaxy ? <GalaxyBackdrop radius={220} starCount={7200} thickness={24} /> : null}
        {showNebula ? <NebulaField /> : null}
        {showDust ? <CosmicDust /> : null}
        <InstancedStars count={4200} radius={230} depth={360} parallax={0.18} size={0.014} />
        <InstancedStars count={1600} radius={150} depth={260} parallax={0.42} size={0.009} warm />
        <GalacticMotionView planets={sortedPlanets} getElapsedDays={getElapsedDays} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.055}
          rotateSpeed={0.66}
          zoomSpeed={0.9}
          panSpeed={0.72}
          screenSpacePanning
          minDistance={18}
          maxDistance={760}
          target={[0, -8, -38]}
        />
        <PostprocessingEffects />
        <Preload all />
      </>
    );
  }

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 145, 245]} fov={52} near={0.02} far={2200} />

      <fog attach="fog" args={["#070b16", 120, 760]} />
      <ambientLight intensity={0.055} />
      <hemisphereLight intensity={0.08} color="#dbeafe" groundColor="#020617" />
      <group ref={galacticFrameRef}>
        {showGalaxy ? <GalaxyBackdrop /> : null}
        {showNebula ? <NebulaField /> : null}
        {showDust ? <CosmicDust /> : null}
        <InstancedStars count={3200} radius={155} depth={230} parallax={0.22} size={0.016} />
        <InstancedStars count={1200} radius={95} depth={150} parallax={0.52} size={0.01} warm />
        <ExplorationNeighborhood registerDestination={registerDestination} />
      </group>

      <group ref={systemRef} scale={1.55}>
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
        dampingFactor={0.06}
        rotateSpeed={0.78}
        zoomSpeed={0.95}
        panSpeed={0.8}
        screenSpacePanning
        minDistance={1.3}
        maxDistance={520}
        target={[0, 0, 0]}
      />

      <CameraRig
        controlsRef={controlsRef}
        planetObjects={planetObjects}
        destinationObjects={destinationObjects}
        systemRef={systemRef}
      />
      <PostprocessingEffects />
      <Preload all />
    </>
  );
}

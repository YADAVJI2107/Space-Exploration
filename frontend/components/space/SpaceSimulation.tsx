"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { ControlPanel } from "@/components/ui/ControlPanel";
import { SessionPanel } from "@/components/ui/SessionPanel";
import { PlanetInfoPanel } from "@/components/space/PlanetInfoPanel";
import { SolarSystemScene } from "@/components/space/SolarSystemScene";
import { useSession } from "@/hooks/useSession";
import { useSpaceData } from "@/hooks/useSpaceData";
import { useSimulationStore } from "@/lib/store";

export default function SpaceSimulation() {
  const { planets, config, isLoading, dataSource, dataError } = useSpaceData();
  const { session, favorites, syncState, error, toggleFavorite } = useSession();
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const currentPlanet = planets.find((p) => p.name === selectedPlanet) || null;

  return (
    <main className="relative h-svh w-screen overflow-hidden bg-[#02030a]">
      <Canvas
        className="touch-none"
        camera={{ position: [0, 14, 31], fov: 55, near: 0.02, far: 1400 }}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          preserveDrawingBuffer: process.env.NODE_ENV !== "production"
        }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color("#02030a");
        }}
      >
        <Suspense fallback={null}>
          <SolarSystemScene planets={planets} config={config} />
        </Suspense>
      </Canvas>

      <ControlPanel
        planets={planets}
        isLoading={isLoading}
        dataSource={dataSource}
        dataError={dataError}
      />
      <SessionPanel session={session} syncState={syncState} error={error} />
      <PlanetInfoPanel
        planet={currentPlanet}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </main>
  );
}

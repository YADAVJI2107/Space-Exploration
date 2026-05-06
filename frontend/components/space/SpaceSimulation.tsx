"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { ControlPanel } from "@/components/ui/ControlPanel";
import { SolarSystemScene } from "@/components/space/SolarSystemScene";
import { useSpaceData } from "@/hooks/useSpaceData";

export default function SpaceSimulation() {
  const { planets, config, isLoading } = useSpaceData();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#02030a]">
      <Canvas
        camera={{ position: [0, 14, 31], fov: 55, near: 0.02, far: 1400 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          preserveDrawingBuffer: process.env.NODE_ENV !== "production"
        }}
        shadows
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

      <ControlPanel planets={planets} isLoading={isLoading} />
    </main>
  );
}

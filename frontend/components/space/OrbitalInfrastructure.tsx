"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense } from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { NasaAssetModel } from "@/components/space/NasaAssetModel";
import type { Planet } from "@/lib/types";

interface OrbitalInfrastructureProps {
  planet: Planet;
}

interface OrbitalAsset {
  id: string;
  name: string;
  orbitRadius: number;
  speed: number;
  phase: number;
  color: string;
  modelUrl: string;
  targetSize: number;
}

export function OrbitalInfrastructure({ planet }: OrbitalInfrastructureProps) {
  const assets = useMemo(() => buildAssets(planet), [planet]);

  if (assets.length === 0) {
    return null;
  }

  return (
    <group>
      {assets.map((asset, index) => (
        <OrbitalAssetMarker key={asset.id} asset={asset} index={index} />
      ))}
    </group>
  );
}

function buildAssets(planet: Planet): OrbitalAsset[] {
  if (planet.name === "Earth") {
    return [
      { id: "hubble", name: "Hubble", orbitRadius: planet.displayRadius * 2.65, speed: 0.72, phase: 4.5, color: "#93c5fd", modelUrl: "/nasa/models/hubble.glb", targetSize: planet.displayRadius * 0.16 },
      { id: "kepler-earth", name: "Kepler", orbitRadius: planet.displayRadius * 3.35, speed: 0.44, phase: 2.1, color: "#f8fafc", modelUrl: "/nasa/models/kepler.glb", targetSize: planet.displayRadius * 0.13 }
    ];
  }

  if (planet.name === "Mars") {
    return [
      { id: "mro", name: "MRO", orbitRadius: planet.displayRadius * 3.05, speed: 1.12, phase: 4.1, color: "#fecaca", modelUrl: "/nasa/models/mro.glb", targetSize: planet.displayRadius * 0.15 },
      { id: "kepler", name: "Kepler", orbitRadius: planet.displayRadius * 3.88, speed: 0.58, phase: 1.4, color: "#fda4af", modelUrl: "/nasa/models/kepler.glb", targetSize: planet.displayRadius * 0.13 }
    ];
  }

  if (planet.name === "Saturn") {
    return [
      { id: "cassini", name: "Cassini", orbitRadius: planet.displayRadius * 4.15, speed: 0.34, phase: 2.2, color: "#fde68a", modelUrl: "/nasa/models/cassini.glb", targetSize: planet.displayRadius * 0.09 }
    ];
  }

  if (planet.name === "Neptune") {
    return [
      { id: "voyager", name: "Voyager", orbitRadius: planet.displayRadius * 4.2, speed: 0.28, phase: 0.7, color: "#bfdbfe", modelUrl: "/nasa/models/voyager.glb", targetSize: planet.displayRadius * 0.1 }
    ];
  }

  return [];
}

function OrbitalAssetMarker({ asset, index }: { asset: OrbitalAsset; index: number }) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!pivotRef.current) {
      return;
    }

    pivotRef.current.rotation.y = asset.phase + state.clock.elapsedTime * asset.speed;
    pivotRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.35 + index) * 0.1;
  });

  return (
    <group ref={pivotRef}>
      <mesh position={[asset.orbitRadius, 0, 0]}>
        <sphereGeometry args={[0.014, 10, 10]} />
        <meshStandardMaterial color={asset.color} emissive={asset.color} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[asset.orbitRadius, 0, 0]} rotation={[0, Math.PI * 0.35, 0]}>
        <Suspense fallback={null}>
          <NasaAssetModel modelUrl={asset.modelUrl} targetSize={asset.targetSize} />
        </Suspense>
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[asset.orbitRadius - 0.006, asset.orbitRadius + 0.006, 96]} />
        <meshBasicMaterial color={asset.color} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[asset.orbitRadius, 0.08, 0]} distanceFactor={18} center zIndexRange={[4, 0]}>
        <div className="hidden rounded border border-white/15 bg-slate-950/60 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-slate-100 backdrop-blur lg:block">
          {asset.name}
        </div>
      </Html>
    </group>
  );
}

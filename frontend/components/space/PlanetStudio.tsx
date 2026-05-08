"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { SaturnRingSystem } from "@/components/space/SaturnRingSystem";
import { tuneStandardMaterial } from "@/lib/three-texture";
import type { Planet } from "@/lib/types";

interface PlanetStudioProps {
  planet: Planet | null;
}

export function PlanetStudio({ planet }: PlanetStudioProps) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(planet?.textureUrl ?? "/textures/2k_earth_daymap.jpg") as THREE.Texture;

  useFrame((_, delta) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y += delta * 0.18;
    }
  });

  if (!planet) {
    return null;
  }

  const studioRadius = Math.max(planet.displayRadius * 2.8, 2.2);
  const atmosphereColor = getAtmosphereColor(planet.name);

  return (
    <group>
      <color attach="background" args={["#030610"]} />
      <fog attach="fog" args={["#030610", 28, 90]} />
      <ambientLight intensity={0.16} />
      <directionalLight position={[0, 3, 9]} intensity={4.2} color="#fff6dc" />
      <directionalLight position={[-6, 2, -4]} intensity={0.9} color="#77d6ff" />
      <pointLight position={[4, -2, 7]} intensity={1.4} color="#f6c27a" />

      <group position={[0, 0, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(planet.axialTilt)]}>
        <mesh ref={bodyRef} castShadow receiveShadow>
          <sphereGeometry args={[studioRadius, 96, 96]} />
          <meshStandardMaterial
            map={texture}
            color={planet.color}
            roughness={planet.name === "Earth" ? 0.68 : 0.84}
            metalness={0.02}
            emissive={planet.name === "Earth" ? "#0a2748" : "#000000"}
            emissiveIntensity={planet.name === "Earth" ? 0.08 : 0}
            onUpdate={tuneStandardMaterial}
          />
        </mesh>

        {atmosphereColor ? (
          <mesh scale={1.045}>
            <sphereGeometry args={[studioRadius, 64, 64]} />
            <meshBasicMaterial
              color={atmosphereColor}
              transparent
              opacity={0.09}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ) : null}

        {planet.hasRings && planet.ringTextureUrl ? (
          <SaturnRingSystem radius={studioRadius} textureUrl={planet.ringTextureUrl} opacityScale={1.18} />
        ) : null}
      </group>

      <Html position={[0, -studioRadius * 1.42, 0]} center distanceFactor={14}>
        <div className="rounded-md border border-cyan-200/25 bg-slate-950/70 px-3 py-2 text-center text-xs text-cyan-100 backdrop-blur">
          <div className="text-sm font-semibold text-white">{planet.name}</div>
          <div className="mt-1 text-slate-300">
            {planet.moonCount} moons · {planet.rotationPeriodHours.toFixed(1)}h rotation
          </div>
        </div>
      </Html>
    </group>
  );
}

function getAtmosphereColor(planetName: string) {
  if (planetName === "Earth") {
    return "#6fd7ff";
  }
  if (planetName === "Venus") {
    return "#ffd39c";
  }
  if (planetName === "Uranus") {
    return "#9be7ef";
  }
  if (planetName === "Neptune") {
    return "#78a9ff";
  }
  return null;
}

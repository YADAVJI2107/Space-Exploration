"use client";

import { Html, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  explorationDestinations,
  explorationDestinationMap,
  galaxyDestinations,
  systemDestinations
} from "@/lib/exploration-data";
import { seededRandom } from "@/lib/seeded-random";
import { useSimulationStore } from "@/lib/store";
import { tuneBasicMaterialTexture } from "@/lib/three-texture";
import type { ExplorationDestination } from "@/lib/types";

interface ExplorationNeighborhoodProps {
  registerDestination: (name: string, object: THREE.Object3D | null) => void;
}

const scratchColor = new THREE.Color();

export function ExplorationNeighborhood({ registerDestination }: ExplorationNeighborhoodProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spiralTexture = useTexture("/nasa/spiral-galaxy-ngc3147.jpg") as THREE.Texture;
  const nebulaTexture = useTexture("/nasa/pillars-of-creation.png") as THREE.Texture;
  const selectedDestination = useSimulationStore((state) => state.selectedDestination);
  const setSelectedDestination = useSimulationStore((state) => state.setSelectedDestination);

  const systemBodies = useMemo(
    () =>
      systemDestinations
        .filter((destination) => destination.kind === "star-system")
        .map((destination, destinationIndex) => ({
        destination,
        satellites: Array.from({ length: destination.orbitingBodies }, (_, index) => {
          const seed = destinationIndex * 97 + index * 19;
          return {
            id: `${destination.id}-${index}`,
            radius: destination.scale * (0.022 + seededRandom(seed + 1) * 0.028),
            orbitRadius: destination.scale * (0.46 + index * 0.26 + seededRandom(seed + 2) * 0.12),
            speed: 0.08 + seededRandom(seed + 3) * 0.2,
            phase: seededRandom(seed + 4) * Math.PI * 2,
            tint: scratchColor
              .set(destination.accentColor)
              .offsetHSL((seededRandom(seed + 5) - 0.5) * 0.12, 0.05, seededRandom(seed + 6) * 0.18)
              .getStyle()
          };
        })
      })),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.018) * 0.035;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.06) * 1.2;
    groupRef.current.position.z = Math.cos(state.clock.elapsedTime * 0.04) * 1.8;
  });

  return (
    <group ref={groupRef}>
      {explorationDestinations
        .filter((destination) => destination.kind === "overview")
        .map((destination) => (
          <DestinationAnchor
            key={destination.id}
            destinationId={destination.id}
            position={destination.position}
            registerDestination={registerDestination}
          >
            <mesh visible={false}>
              <sphereGeometry args={[2, 8, 8]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </DestinationAnchor>
        ))}

      {galaxyDestinations.map((destination, index) => (
        <GalaxyMarker
          key={destination.id}
          destination={destination}
          index={index}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          registerDestination={registerDestination}
          spiralTexture={spiralTexture}
          nebulaTexture={nebulaTexture}
        />
      ))}

      {systemBodies.map(({ destination, satellites }, index) => (
        <SystemMarker
          key={destination.id}
          destination={destination}
          index={index}
          satellites={satellites}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          registerDestination={registerDestination}
        />
      ))}
    </group>
  );
}

interface DestinationAnchorProps {
  children: ReactNode;
  destinationId: string;
  position: [number, number, number];
  registerDestination: (name: string, object: THREE.Object3D | null) => void;
}

function DestinationAnchor({
  children,
  destinationId,
  position,
  registerDestination
}: DestinationAnchorProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    registerDestination(destinationId, group);
    return () => registerDestination(destinationId, null);
  }, [destinationId, registerDestination]);

  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  );
}

interface GalaxyMarkerProps {
  destination: ExplorationDestination;
  index: number;
  selectedDestination: string;
  setSelectedDestination: (destination: string) => void;
  registerDestination: (name: string, object: THREE.Object3D | null) => void;
  spiralTexture: THREE.Texture;
  nebulaTexture: THREE.Texture;
}

function GalaxyMarker({
  destination,
  index,
  selectedDestination,
  setSelectedDestination,
  registerDestination,
  spiralTexture,
  nebulaTexture
}: GalaxyMarkerProps) {
  const haloRef = useRef<THREE.Mesh>(null);
  const isSelected = selectedDestination === destination.id;

  useFrame((state) => {
    if (haloRef.current) {
      haloRef.current.rotation.z = state.clock.elapsedTime * 0.018 + index * 0.4;
      const pulse = isSelected ? 1.02 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04 : 1;
      haloRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <DestinationAnchor
      destinationId={destination.id}
      position={destination.position}
      registerDestination={registerDestination}
    >
      <group
        onClick={(event) => {
          event.stopPropagation();
          setSelectedDestination(destination.id);
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <mesh rotation={[Math.PI / 2, 0, index * 0.28]}>
          <planeGeometry args={[destination.scale * 1.72, destination.scale * 1.72]} />
          <meshBasicMaterial
            map={spiralTexture}
            color={destination.accentColor}
            transparent
            opacity={destination.id === "milky-way" ? 0.3 : 0.27}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            onUpdate={(material) => tuneBasicMaterialTexture(material.map)}
          />
        </mesh>

        <mesh ref={haloRef} rotation={[Math.PI / 2, 0, index * -0.42]}>
          <ringGeometry
            args={[destination.scale * 0.76, destination.scale * 1.22, 160]}
          />
          <meshBasicMaterial
            color={destination.accentColor}
            transparent
            opacity={isSelected ? 0.16 : 0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, index * 0.19]} position={[0, 3, 0]}>
          <planeGeometry args={[destination.scale * 1.5, destination.scale * 0.95]} />
          <meshBasicMaterial
            map={nebulaTexture}
            color={destination.accentColor}
            transparent
            opacity={0.035}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            onUpdate={(material) => tuneBasicMaterialTexture(material.map)}
          />
        </mesh>

        <pointLight
          color={destination.accentColor}
          intensity={isSelected ? 2.5 : 1.4}
          distance={destination.scale * 2.7}
        />

        <Html position={[0, destination.scale * 0.12, 0]} distanceFactor={110} center zIndexRange={[3, 0]}>
          <button
            type="button"
            onClick={() => setSelectedDestination(destination.id)}
            className={`hidden rounded border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] backdrop-blur md:block ${
              isSelected
                ? "border-cyan-200/60 bg-slate-950/70 text-cyan-100"
                : "border-white/10 bg-slate-950/40 text-slate-300"
            }`}
          >
            {destination.name}
          </button>
        </Html>
      </group>
    </DestinationAnchor>
  );
}

interface SystemMarkerProps {
  destination: ExplorationDestination;
  index: number;
  satellites: Array<{
    id: string;
    radius: number;
    orbitRadius: number;
    speed: number;
    phase: number;
    tint: string;
  }>;
  selectedDestination: string;
  setSelectedDestination: (destination: string) => void;
  registerDestination: (name: string, object: THREE.Object3D | null) => void;
}

function SystemMarker({
  destination,
  index,
  satellites,
  selectedDestination,
  setSelectedDestination,
  registerDestination
}: SystemMarkerProps) {
  const isSelected = selectedDestination === destination.id;
  const parentGalaxy = destination.parentId ? explorationDestinationMap[destination.parentId] : null;

  return (
    <DestinationAnchor
      destinationId={destination.id}
      position={destination.position}
      registerDestination={registerDestination}
    >
      <group
        onClick={(event) => {
          event.stopPropagation();
          setSelectedDestination(destination.id);
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        {parentGalaxy ? (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[destination.scale * 0.58, destination.scale * 0.64, 96]} />
            <meshBasicMaterial
              color={parentGalaxy.accentColor}
              transparent
              opacity={0.055}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ) : null}

        <mesh>
          <sphereGeometry args={[destination.scale * 0.12, 28, 28]} />
          <meshBasicMaterial color={destination.accentColor} toneMapped={false} />
        </mesh>

        <mesh scale={isSelected ? 1.48 : 1.22}>
          <sphereGeometry args={[destination.scale * 0.2, 24, 24]} />
          <meshBasicMaterial
            color={destination.accentColor}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {satellites.map((satellite, satelliteIndex) => (
          <SatelliteOrbit
            key={satellite.id}
            destinationIndex={index}
            index={satelliteIndex}
            orbitRadius={satellite.orbitRadius}
            speed={satellite.speed}
            phase={satellite.phase}
            radius={satellite.radius}
            tint={satellite.tint}
          />
        ))}

        <Html
          position={[0, destination.scale * 0.28, 0]}
          distanceFactor={58}
          center
          zIndexRange={[4, 0]}
        >
          <button
            type="button"
            onClick={() => setSelectedDestination(destination.id)}
            className={`hidden rounded border px-2 py-0.5 text-[8px] uppercase tracking-[0.16em] backdrop-blur lg:block ${
              isSelected
                ? "border-cyan-200/55 bg-slate-950/70 text-cyan-100"
                : "border-white/10 bg-slate-950/35 text-slate-400"
            }`}
          >
            {destination.name}
          </button>
        </Html>
      </group>
    </DestinationAnchor>
  );
}

interface SatelliteOrbitProps {
  destinationIndex: number;
  index: number;
  orbitRadius: number;
  speed: number;
  phase: number;
  radius: number;
  tint: string;
}

function SatelliteOrbit({
  destinationIndex,
  index,
  orbitRadius,
  speed,
  phase,
  radius,
  tint
}: SatelliteOrbitProps) {
  const pivotRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!pivotRef.current) {
      return;
    }

    pivotRef.current.rotation.y = phase + state.clock.elapsedTime * speed;
    pivotRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12 + destinationIndex + index) * 0.12;
  });

  return (
    <group ref={pivotRef}>
      <mesh position={[orbitRadius, 0, 0]}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={tint} roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - radius * 0.12, orbitRadius + radius * 0.12, 96]} />
        <meshBasicMaterial color="#b6d7ee" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

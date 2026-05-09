"use client";

import { Html, Line, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedTexturePlane } from "@/components/space/RoundedTexturePlane";
import {
  explorationDestinationMap,
  galaxyDestinations,
  systemDestinations
} from "@/lib/exploration-data";
import { seededRandom } from "@/lib/seeded-random";
import { useSimulationStore } from "@/lib/store";
import type { ExplorationDestination, Planet } from "@/lib/types";

interface GalacticMotionViewProps {
  planets: Planet[];
  getElapsedDays: () => number;
}

const WORLD_SCALE = 0.72;
const HELIX_LENGTH = 8.5;
const orbitScratch = new THREE.Vector3();
const eulerScratch = new THREE.Euler();
const scratchColor = new THREE.Color();

export function GalacticMotionView({ planets, getElapsedDays }: GalacticMotionViewProps) {
  const [focusedVortexId, setFocusedVortexId] = useState("solar-system");
  const [isVortexDetail, setIsVortexDetail] = useState(false);
  const focusGroupRef = useRef<THREE.Group>(null);
  const spiralTexture = useTexture("/nasa/spiral-galaxy-ngc3147.jpg") as THREE.Texture;
  const selectedDestination = useSimulationStore((state) => state.selectedDestination);
  const setSelectedDestination = useSimulationStore((state) => state.setSelectedDestination);
  const sortedPlanets = useMemo(
    () => [...planets].sort((a, b) => a.orbitRadius - b.orbitRadius),
    [planets]
  );
  const activeVortexSystem = useMemo(() => {
    const selectedSystem = systemDestinations.find((system) => system.id === focusedVortexId);
    return selectedSystem ?? explorationDestinationMap["solar-system"];
  }, [focusedVortexId]);
  const focusedGalaxy = useMemo(() => {
    const selected = explorationDestinationMap[selectedDestination];
    if (selected?.kind === "galaxy") {
      return selected;
    }

    return activeVortexSystem.parentId
      ? explorationDestinationMap[activeVortexSystem.parentId]
      : explorationDestinationMap["milky-way"];
  }, [activeVortexSystem, selectedDestination]);

  const handleSelectSystem = (destination: string) => {
    setSelectedDestination(destination);
    if (systemDestinations.some((system) => system.id === destination)) {
      setFocusedVortexId(destination);
      setIsVortexDetail(false);
    }
  };

  useFrame((_, delta) => {
    if (!focusGroupRef.current) {
      return;
    }

    const focusCenter = scaledPosition(focusedGalaxy.position);
    const targetOffset = new THREE.Vector3(-focusCenter.x, -focusCenter.y * 0.45, -focusCenter.z);
    const damping = 1 - Math.pow(0.002, delta);
    focusGroupRef.current.position.lerp(targetOffset, damping * 0.32);
  });

  return (
    <group>
      <ambientLight intensity={0.09} />
      <hemisphereLight intensity={0.12} color="#dbeafe" groundColor="#020617" />
      <pointLight position={[0, 70, 30]} intensity={2.4} color="#dbeafe" />

      <group ref={focusGroupRef}>
        {galaxyDestinations.map((galaxy, index) => (
          <GalaxyMotionDisk
            key={galaxy.id}
            galaxy={galaxy}
            index={index}
            texture={spiralTexture}
            selectedDestination={selectedDestination}
            onSelect={setSelectedDestination}
          />
        ))}

        {systemDestinations.map((system, index) => (
          <RevolvingSystem
            key={system.id}
            system={system}
            index={index}
            planets={sortedPlanets}
            getElapsedDays={getElapsedDays}
            selectedDestination={selectedDestination}
            onSelect={handleSelectSystem}
          />
        ))}

      </group>

      <FocusedVortexShowcase
        destination={activeVortexSystem}
        planets={activeVortexSystem.id === "solar-system" ? sortedPlanets : null}
        getElapsedDays={getElapsedDays}
        isDetail={isVortexDetail}
        onFocusSolarSystem={() => {
          setFocusedVortexId("solar-system");
          setSelectedDestination("solar-system");
          setIsVortexDetail((detail) => !detail);
        }}
      />

      <Html position={[0, 94, 44]} center distanceFactor={210} zIndexRange={[1, 0]}>
        <div className="hidden w-80 rounded-lg border border-cyan-200/10 bg-slate-950/40 px-4 py-3 text-center text-[11px] font-normal leading-5 text-cyan-50/80 backdrop-blur-sm md:block">
          Galactic Motion View: fixed galaxies, systems orbiting their centers, and local helical
          planet tracks showing orbital motion plus forward system travel.
        </div>
      </Html>

    </group>
  );
}

function FocusedVortexShowcase({
  destination,
  planets,
  getElapsedDays,
  isDetail,
  onFocusSolarSystem
}: {
  destination: ExplorationDestination;
  planets: Planet[] | null;
  getElapsedDays: () => number;
  isDetail: boolean;
  onFocusSolarSystem: () => void;
}) {
  const systemIndex = Math.max(
    systemDestinations.findIndex((system) => system.id === destination.id),
    0
  );

  return (
    <group
      position={isDetail ? [34, 18, -34] : [72, 24, -18]}
      rotation={isDetail ? [0.02, -0.32, 0.02] : [0.08, -0.54, 0.06]}
    >
      <HelicalLocalSystem
        destination={destination}
        index={systemIndex}
        planets={planets}
        getElapsedDays={getElapsedDays}
        scale={isDetail ? 6.4 : 3.35}
        highlighted
        showPlanetNames={isDetail && destination.id === "solar-system"}
      />
      <Html position={[0, isDetail ? 12.8 : 7.6, 0]} center distanceFactor={isDetail ? 250 : 190} zIndexRange={[2, 0]}>
        <div className="w-52 rounded-lg border border-cyan-200/12 bg-slate-950/45 px-3 py-2 text-center text-[9px] font-normal leading-4 text-cyan-50/75 backdrop-blur-sm">
          <div className="font-normal uppercase tracking-[0.12em] text-cyan-100/90">
            {destination.name}
          </div>
          <div className="mt-1 text-slate-300/75">
            Local vortex: planets orbit while the whole system travels forward.
          </div>
          <button
            type="button"
            onClick={onFocusSolarSystem}
            className="mt-2 rounded border border-cyan-200/20 bg-cyan-200/10 px-2 py-1 text-[8px] font-normal uppercase tracking-[0.08em] text-cyan-100/85"
          >
            {isDetail ? "Exit Detail" : "Solar Vortex Detail"}
          </button>
        </div>
      </Html>
    </group>
  );
}

function GalaxyMotionDisk({
  galaxy,
  index,
  texture,
  selectedDestination,
  onSelect
}: {
  galaxy: ExplorationDestination;
  index: number;
  texture: THREE.Texture;
  selectedDestination: string;
  onSelect: (destination: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const center = scaledPosition(galaxy.position);
  const isSelected = selectedDestination === galaxy.id;
  const diskSize = galaxy.scale * WORLD_SCALE * 2.05;

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * (0.012 + index * 0.002);
    groupRef.current.position.y = center.y + Math.sin(state.clock.elapsedTime * 0.18 + index) * 0.8;
  });

  return (
    <group
      ref={groupRef}
      position={[center.x, center.y, center.z]}
      rotation={[0.18 + index * 0.08, index * 0.18, -0.08 + index * 0.05]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(galaxy.id);
      }}
      onPointerEnter={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
      }}
    >
      <RoundedTexturePlane
        texture={texture}
        color={galaxy.accentColor}
        width={diskSize}
        height={diskSize}
        opacity={isSelected ? 0.36 : 0.24}
        cornerRadius={diskSize * 0.19}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <RoundedTexturePlane
        texture={texture}
        color={galaxy.accentColor}
        width={diskSize}
        height={diskSize}
        opacity={isSelected ? 0.36 : 0.24}
        cornerRadius={diskSize * 0.19}
        rotation={[Math.PI / 2, 0, 0]}
      />

      <mesh>
        <sphereGeometry args={[galaxy.scale * WORLD_SCALE * 0.09, 32, 32]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive={galaxy.accentColor}
          emissiveIntensity={isSelected ? 0.9 : 0.45}
          roughness={0.5}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[diskSize * 0.28, diskSize * 0.52, 192]} />
        <meshBasicMaterial
          color={galaxy.accentColor}
          transparent
          opacity={isSelected ? 0.14 : 0.07}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {isSelected ? (
        <Html position={[0, galaxy.scale * WORLD_SCALE * 0.16, 0]} distanceFactor={260} center zIndexRange={[1, 0]}>
          <button
            type="button"
            onClick={() => onSelect(galaxy.id)}
            className="rounded border border-cyan-200/20 bg-slate-950/30 px-1.5 py-0.5 text-[6px] font-normal uppercase tracking-[0.08em] text-cyan-50/70 backdrop-blur-sm"
          >
            {galaxy.name}
          </button>
        </Html>
      ) : null}
    </group>
  );
}

function RevolvingSystem({
  system,
  index,
  planets,
  getElapsedDays,
  selectedDestination,
  onSelect
}: {
  system: ExplorationDestination;
  index: number;
  planets: Planet[];
  getElapsedDays: () => number;
  selectedDestination: string;
  onSelect: (destination: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tangentRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);
  const parentGalaxy = system.parentId ? explorationDestinationMap[system.parentId] : null;
  const parentCenter = scaledPosition(parentGalaxy?.position ?? [0, 0, 0]);
  const isSelected = selectedDestination === system.id;
  const isSolarSystem = system.id === "solar-system";
  const orbitConfig = useMemo(() => buildSystemOrbit(system, index), [index, system]);
  const pathPoints = useMemo(
    () => buildOrbitPath(parentCenter, orbitConfig),
    [orbitConfig, parentCenter]
  );
  const initialPosition = useMemo(
    () => orbitPoint(parentCenter, orbitConfig, orbitConfig.phase, new THREE.Vector3()),
    [orbitConfig, parentCenter]
  );
  const localScale = isSolarSystem ? 1.12 : 0.92;

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }

    const { isPaused, timeScale } = useSimulationStore.getState();
    if (!isPaused) {
      phaseRef.current += delta * orbitConfig.speed * Math.pow(timeScale / 8, 0.32);
    }

    const phase = orbitConfig.phase + phaseRef.current;
    const position = orbitPoint(parentCenter, orbitConfig, phase, orbitScratch);
    const ahead = orbitPoint(parentCenter, orbitConfig, phase + 0.035, new THREE.Vector3());
    const tangentYaw = Math.atan2(ahead.x - position.x, ahead.z - position.z);
    groupRef.current.position.copy(position);
    groupRef.current.rotation.y = tangentYaw;
    groupRef.current.rotation.z = Math.sin(phase * 1.7) * 0.05;

    if (tangentRef.current) {
      tangentRef.current.rotation.y = -tangentYaw;
    }
  });

  return (
    <>
      <Line
        points={pathPoints}
        color={system.accentColor}
        transparent
        opacity={isSelected ? 0.42 : 0.16}
        lineWidth={isSelected ? 1.5 : 0.8}
      />

      <group
        ref={groupRef}
        position={initialPosition}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(system.id);
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <mesh>
          <sphereGeometry args={[isSolarSystem ? 1.15 : 0.86, 32, 32]} />
          <meshStandardMaterial
            color={isSolarSystem ? "#fde68a" : system.accentColor}
            emissive={system.accentColor}
            emissiveIntensity={isSelected ? 0.9 : 0.42}
            roughness={0.42}
          />
        </mesh>

        <group ref={tangentRef}>
          <Line
            points={[new THREE.Vector3(-2.1, 0.16, 0), new THREE.Vector3(2.9, 0.16, 0)]}
            color={system.accentColor}
            transparent
            opacity={isSelected ? 0.66 : 0.32}
            lineWidth={isSelected ? 1.3 : 0.8}
          />
          <mesh position={[3.2, 0.16, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.18, 0.45, 18]} />
            <meshBasicMaterial color={system.accentColor} transparent opacity={isSelected ? 0.86 : 0.48} />
          </mesh>
        </group>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.9, 3, 120]} />
          <meshBasicMaterial
            color={system.accentColor}
            transparent
            opacity={isSelected ? 0.3 : 0.14}
            side={THREE.DoubleSide}
          />
        </mesh>

        <HelicalLocalSystem
          destination={system}
          index={index}
          planets={isSolarSystem ? planets : null}
          getElapsedDays={getElapsedDays}
          scale={localScale}
          highlighted={isSelected}
          showPlanetNames={false}
        />

        {isSelected ? (
          <mesh position={[0, isSolarSystem ? 3.1 : 2.6, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color={system.accentColor} transparent opacity={0.65} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}

function HelicalLocalSystem({
  destination,
  index,
  planets,
  getElapsedDays,
  scale,
  highlighted,
  showPlanetNames
}: {
  destination: ExplorationDestination;
  index: number;
  planets: Planet[] | null;
  getElapsedDays: () => number;
  scale: number;
  highlighted: boolean;
  showPlanetNames: boolean;
}) {
  const starRef = useRef<THREE.Mesh>(null);
  const bodyRefs = useRef<Array<THREE.Mesh | null>>([]);
  const travelRef = useRef(0);
  const bodies = useMemo(
    () => (planets ? buildPlanetHelixBodies(planets) : buildSyntheticHelixBodies(destination, index)),
    [destination, index, planets]
  );
  const centerlinePoints = useMemo(() => buildCenterlinePath(), []);
  const helixPaths = useMemo(
    () => bodies.map((body) => buildHelixPath(body.radius, body.phase, body.turns)),
    [bodies]
  );

  useFrame((_, delta) => {
    const { isPaused, timeScale } = useSimulationStore.getState();
    const motionScale = isPaused ? 0 : Math.pow(timeScale / 8, 0.28);
    travelRef.current += delta * motionScale * 1.25;
    const normalizedTravel = wrapTravel(travelRef.current);

    if (starRef.current) {
      starRef.current.position.copy(centerlinePoint(normalizedTravel, new THREE.Vector3()));
      starRef.current.rotation.y += delta * 0.35;
    }

    bodies.forEach((body, bodyIndex) => {
      const mesh = bodyRefs.current[bodyIndex];
      if (!mesh) {
        return;
      }

      const elapsedDays = getElapsedDays();
      const planetPhase = body.periodDays
        ? (elapsedDays / body.periodDays) * Math.PI * 2
        : Number(mesh.userData.phase ?? 0) + delta * body.speed * motionScale;
      if (!body.periodDays) {
        mesh.userData.phase = planetPhase;
      }

      const phase = body.phase + planetPhase + (normalizedTravel / HELIX_LENGTH) * body.turns * Math.PI * 2;
      const center = centerlinePoint(normalizedTravel, new THREE.Vector3());
      mesh.position.set(center.x, center.y + Math.cos(phase) * body.radius, center.z + Math.sin(phase) * body.radius);
      mesh.rotation.y += delta * 0.9;
    });
  });

  return (
    <group scale={scale}>
      <Line
        points={centerlinePoints}
        color="#fde68a"
        transparent
        opacity={highlighted ? 0.74 : 0.38}
        lineWidth={highlighted ? 2 : 1.25}
      />
      <mesh ref={starRef}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color={destination.id === "solar-system" ? "#fde68a" : destination.accentColor}
          emissive={destination.id === "solar-system" ? "#facc15" : destination.accentColor}
          emissiveIntensity={highlighted ? 1.1 : 0.62}
          roughness={0.36}
        />
      </mesh>
      {bodies.map((body, bodyIndex) => {
        return (
          <group key={body.id} rotation={[body.tilt, 0, 0]}>
            <Line
              points={helixPaths[bodyIndex]}
              color={body.color}
              transparent
          opacity={highlighted ? 0.44 : 0.25}
              lineWidth={highlighted ? 1.45 : 0.95}
            />
            <mesh ref={(node) => { bodyRefs.current[bodyIndex] = node; }}>
              <sphereGeometry args={[body.size, 12, 12]} />
              <meshStandardMaterial
                color={body.color}
                emissive={body.color}
                emissiveIntensity={0.28}
                roughness={0.5}
              />
              {showPlanetNames ? (
                <Html position={[0, body.size + 0.22, 0]} center distanceFactor={36} zIndexRange={[2, 0]}>
                  <div className="rounded border border-white/15 bg-slate-950/50 px-1.5 py-0.5 text-[7px] font-normal uppercase tracking-[0.06em] text-slate-100/85 backdrop-blur-sm">
                    {body.name}
                  </div>
                </Html>
              ) : null}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

interface HelixBody {
  id: string;
  name: string;
  radius: number;
  speed: number;
  phase: number;
  size: number;
  tilt: number;
  turns: number;
  color: string;
  periodDays?: number;
}

function buildPlanetHelixBodies(planets: Planet[]): HelixBody[] {
  return planets.map((planet, index) => ({
    id: planet.name,
    name: planet.name,
    radius: 0.52 + index * 0.16,
    speed: 0.2,
    phase: planet.phase + index * 0.7,
    size: Math.max(planet.displayRadius * 0.12, 0.075),
    tilt: THREE.MathUtils.degToRad(planet.inclination * 2.4),
    turns: 2.1 + index * 0.08,
    color: planet.color,
    periodDays: planet.siderealPeriodDays
  }));
}

function buildSyntheticHelixBodies(destination: ExplorationDestination, index: number): HelixBody[] {
  return Array.from({ length: Math.max(destination.orbitingBodies, 3) }, (_, bodyIndex) => {
    const seed = index * 91 + bodyIndex * 17;

    return {
      id: `${destination.id}-${bodyIndex}`,
      name: `Planet ${bodyIndex + 1}`,
      radius: 0.54 + bodyIndex * 0.18,
      speed: 0.42 + seededRandom(seed + 2) * 0.48,
      phase: bodyIndex * 1.7 + index + seededRandom(seed + 3) * 0.8,
      size: 0.08 + seededRandom(seed + 4) * 0.08,
      tilt: THREE.MathUtils.degToRad(8 + seededRandom(seed + 5) * 20),
      turns: 2.2 + seededRandom(seed + 6) * 0.75,
      color: scratchColor.set(destination.accentColor).offsetHSL((seededRandom(seed + 7) - 0.5) * 0.12, 0.04, 0.08).getStyle()
    };
  });
}

function buildHelixPath(radius: number, phase: number, turns: number) {
  return Array.from({ length: 120 }, (_, index) => {
    const progress = index / 119;
    const x = (progress - 0.5) * HELIX_LENGTH;
    const theta = phase + progress * turns * Math.PI * 2;
    const center = centerlinePoint(x, new THREE.Vector3());

    return new THREE.Vector3(center.x, center.y + Math.cos(theta) * radius, center.z + Math.sin(theta) * radius);
  });
}

function buildCenterlinePath() {
  return Array.from({ length: 72 }, (_, index) => {
    const progress = index / 71;
    const x = (progress - 0.5) * HELIX_LENGTH;
    return centerlinePoint(x, new THREE.Vector3());
  });
}

function centerlinePoint(x: number, target: THREE.Vector3) {
  const normalized = x / HELIX_LENGTH;
  const arc = normalized * Math.PI;
  target.set(
    x,
    Math.sin(arc * 1.25) * 1.15,
    (1 - Math.cos(arc)) * 2.6 + Math.sin(arc * 2.1 + 0.9) * 0.52
  );
  return target;
}

function wrapTravel(value: number) {
  return (((value + HELIX_LENGTH / 2) % HELIX_LENGTH) + HELIX_LENGTH) % HELIX_LENGTH - HELIX_LENGTH / 2;
}

function buildSystemOrbit(system: ExplorationDestination, index: number) {
  const parent = system.parentId ? explorationDestinationMap[system.parentId] : null;
  const parentScale = parent?.scale ?? 48;
  const seed = index * 43 + system.scale * 11;

  return {
    radius: parentScale * WORLD_SCALE * (0.64 + (index % 4) * 0.22 + seededRandom(seed) * 0.1),
    squish: 0.58 + seededRandom(seed + 1) * 0.18,
    tilt: THREE.MathUtils.degToRad(10 + seededRandom(seed + 2) * 22),
    yaw: seededRandom(seed + 3) * Math.PI * 2,
    phase: seededRandom(seed + 4) * Math.PI * 2,
    speed: 0.13 + seededRandom(seed + 5) * 0.08
  };
}

function buildOrbitPath(
  center: THREE.Vector3,
  orbitConfig: ReturnType<typeof buildSystemOrbit>
) {
  return Array.from({ length: 180 }, (_, index) =>
    orbitPoint(center, orbitConfig, (index / 179) * Math.PI * 2, new THREE.Vector3())
  );
}

function orbitPoint(
  center: THREE.Vector3,
  orbitConfig: ReturnType<typeof buildSystemOrbit>,
  phase: number,
  target: THREE.Vector3
) {
  target.set(
    Math.cos(phase) * orbitConfig.radius,
    Math.sin(phase * 2) * orbitConfig.radius * 0.06,
    Math.sin(phase) * orbitConfig.radius * orbitConfig.squish
  );

  eulerScratch.set(orbitConfig.tilt, orbitConfig.yaw, 0);
  target.applyEuler(eulerScratch).add(center);
  return target;
}

function scaledPosition(position: [number, number, number]) {
  return new THREE.Vector3(
    position[0] * WORLD_SCALE,
    position[1] * WORLD_SCALE,
    position[2] * WORLD_SCALE
  );
}

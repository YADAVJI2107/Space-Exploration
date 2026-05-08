"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { RefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSimulationStore } from "@/lib/store";

interface CameraRigProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  planetObjects: RefObject<Record<string, THREE.Object3D>>;
  systemRef: RefObject<THREE.Group | null>;
}

export function CameraRig({ controlsRef, planetObjects, systemRef }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const targetPositionRef = useRef(new THREE.Vector3());
  const desiredCameraRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const systemCenterRef = useRef(new THREE.Vector3());
  const lastFollowTargetRef = useRef<string | null>(null);
  const transitionTimeRef = useRef(0);
  const maxTransitionTimeRef = useRef(0);
  const isUserOrbitingRef = useRef(false);
  const cameraReleaseUntilRef = useRef(0);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const handleStart = () => {
      isUserOrbitingRef.current = true;
    };

    const handleEnd = () => {
      isUserOrbitingRef.current = false;
      cameraReleaseUntilRef.current = performance.now() + 1800;
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const targetPosition = targetPositionRef.current;
    const desiredCamera = desiredCameraRef.current;
    const direction = directionRef.current;
    const systemCenter = systemCenterRef.current;
    const { followTarget, viewMode } = useSimulationStore.getState();
    const manualOrbitActive =
      isUserOrbitingRef.current || performance.now() < cameraReleaseUntilRef.current;

    // Cinematic transition when planet is selected
    const isPlanetTransition = 
      followTarget && 
      planetObjects.current[followTarget] && 
      lastFollowTargetRef.current !== followTarget;

    if (isPlanetTransition) {
      transitionTimeRef.current = 0;
      maxTransitionTimeRef.current = 1.2; // 1.2 seconds cinematic transition
      lastFollowTargetRef.current = followTarget;
    }

    // Dynamic damping based on transition state
    let damping: number;
    if (isPlanetTransition || transitionTimeRef.current > 0) {
      // Cinematic ease-out curve
      transitionTimeRef.current += delta;
      const progress = Math.min(transitionTimeRef.current / maxTransitionTimeRef.current, 1);
      // Ease-out cubic: 1 - (1-x)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      damping = 1 - Math.pow(0.001, delta * (2 - easeProgress)); // Faster initially, then slower
    } else {
      // Normal steady damping
      damping = 1 - Math.pow(0.0008, delta);
    }

    if (followTarget && planetObjects.current[followTarget]) {
      const planet = planetObjects.current[followTarget];
      planet.getWorldPosition(targetPosition);
      const displayRadius = Number(planet.userData.displayRadius ?? 1);
      
      const targetDistance = Math.max(displayRadius * 7.2, 5.4);
      const verticalOffset = displayRadius * 1.2;

      direction.copy(camera.position).sub(controls.target);
      if (direction.lengthSq() < 0.001) {
        direction.set(0.42, 0.22, 1).normalize();
      } else {
        direction.normalize();
      }

      desiredCamera.copy(targetPosition).addScaledVector(direction, targetDistance);
      desiredCamera.y += verticalOffset;

      controls.target.lerp(targetPosition, manualOrbitActive ? damping * 0.28 : damping * 0.48);
      if (!manualOrbitActive || isPlanetTransition) {
        camera.position.lerp(desiredCamera, damping * 0.42);
      }
    } else if (viewMode === "system" && systemRef.current) {
      transitionTimeRef.current = 0;
      lastFollowTargetRef.current = null;
      systemRef.current.getWorldPosition(systemCenter);
      
      // Slower damping for system view
      const systemDamping = 1 - Math.pow(0.0005, delta);
      controls.target.lerp(systemCenter, systemDamping * 0.32);
    }

    controls.update();
  });

  return null;
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { RefObject, useRef } from "react";
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
    const damping = 1 - Math.pow(0.0008, delta);

    if (followTarget && planetObjects.current[followTarget]) {
      const planet = planetObjects.current[followTarget];
      planet.getWorldPosition(targetPosition);
      const displayRadius = Number(planet.userData.displayRadius ?? 1);
      const targetDistance = Math.max(displayRadius * 8, 4.5);

      direction.copy(camera.position).sub(controls.target);
      if (direction.lengthSq() < 0.001) {
        direction.set(0.35, 0.28, 1).normalize();
      } else {
        direction.normalize();
      }

      desiredCamera.copy(targetPosition).addScaledVector(direction, targetDistance);
      desiredCamera.y += displayRadius * 1.4;

      controls.target.lerp(targetPosition, damping);
      camera.position.lerp(desiredCamera, damping * 0.58);
    } else if (viewMode === "system" && systemRef.current) {
      systemRef.current.getWorldPosition(systemCenter);
      controls.target.lerp(systemCenter, damping * 0.42);
    }

    controls.update();
  });

  return null;
}

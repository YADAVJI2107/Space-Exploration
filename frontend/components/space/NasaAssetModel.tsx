"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface NasaAssetModelProps {
  modelUrl: string;
  targetSize: number;
}

export function NasaAssetModel({ modelUrl, targetSize }: NasaAssetModelProps) {
  const gltf = useGLTF(modelUrl);

  const { scene, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z, 1);

    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return {
      scene: gltf.scene,
      scale: targetSize / maxDimension
    };
  }, [gltf.scene, targetSize]);

  return <Clone object={scene} scale={scale} />;
}

useGLTF.preload("/nasa/models/hubble.glb");
useGLTF.preload("/nasa/models/mro.glb");
useGLTF.preload("/nasa/models/voyager.glb");
useGLTF.preload("/nasa/models/cassini.glb");

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { tuneBasicMaterialTexture } from "@/lib/three-texture";

interface RoundedTexturePlaneProps {
  texture: THREE.Texture;
  width: number;
  height: number;
  opacity: number;
  color?: string;
  cornerRadius?: number;
  rotation?: [number, number, number];
}

export function RoundedTexturePlane({
  texture,
  width,
  height,
  opacity,
  color = "#ffffff",
  cornerRadius,
  rotation = [0, 0, 0]
}: RoundedTexturePlaneProps) {
  const geometry = useMemo(
    () => createRoundedPlaneGeometry(width, height, cornerRadius ?? Math.min(width, height) * 0.16),
    [cornerRadius, height, width]
  );

  return (
    <mesh rotation={rotation} geometry={geometry}>
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        onUpdate={(material) => tuneBasicMaterialTexture(material.map)}
      />
    </mesh>
  );
}

function createRoundedPlaneGeometry(width: number, height: number, radius: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const safeRadius = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + safeRadius, -halfHeight);
  shape.lineTo(halfWidth - safeRadius, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + safeRadius);
  shape.lineTo(halfWidth, halfHeight - safeRadius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - safeRadius, halfHeight);
  shape.lineTo(-halfWidth + safeRadius, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - safeRadius);
  shape.lineTo(-halfWidth, -halfHeight + safeRadius);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + safeRadius, -halfHeight);

  const geometry = new THREE.ShapeGeometry(shape, 18);
  const position = geometry.getAttribute("position");
  const uvs = new Float32Array(position.count * 2);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    uvs[index * 2] = (x + halfWidth) / width;
    uvs[index * 2 + 1] = (y + halfHeight) / height;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

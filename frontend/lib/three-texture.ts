import * as THREE from "three";

export function tuneTexture(texture: THREE.Texture | null | undefined) {
  if (!texture) {
    return;
  }

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(texture.anisotropy, 8);
  texture.needsUpdate = true;
}

export function tuneStandardMaterial(material: THREE.MeshStandardMaterial) {
  tuneTexture(material.map);
}

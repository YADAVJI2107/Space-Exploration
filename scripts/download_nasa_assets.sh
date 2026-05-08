#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NASA_DIR="$ROOT_DIR/frontend/public/nasa"
NASA_MODEL_DIR="$NASA_DIR/models"

mkdir -p "$NASA_DIR"
mkdir -p "$NASA_MODEL_DIR"

download() {
  local url="$1"
  local target="$2"
  echo "Downloading $(basename "$target")"
  curl -LfsS "$url" -o "$target"
}

download "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/image/apollo-11---view-of-the-moon/Apollo%2011%20-%20View%20of%20the%20Moon.jpg" "$NASA_DIR/moon-apollo11.jpg"
download "https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2022/10/STScI-01GFXQX1SG9AV3F2A2AHMV7HTA.png/jcr:content/renditions/cq5dam.web.1280.1280.png" "$NASA_DIR/pillars-of-creation.png"
download "https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2019/07/STScI-01EVSVD8TB93V5WMFJWPWZG41T.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg" "$NASA_DIR/spiral-galaxy-ngc3147.jpg"

download "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Hubble%20Space%20Telescope%20(A)/Hubble%20Space%20Telescope%20(A).glb" "$NASA_MODEL_DIR/hubble.glb"
download "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Mars%20Reconnaissance%20Orbiter%20(MRO)%20(A)/Mars%20Reconnaissance%20Orbiter%20(MRO)%20(A).glb" "$NASA_MODEL_DIR/mro.glb"
download "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Kepler%20(A)/Kepler%20(A).glb" "$NASA_MODEL_DIR/kepler.glb"
download "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Voyager%20Probe%20(A)/Voyager%20Probe%20(A).glb" "$NASA_MODEL_DIR/voyager.glb"
download "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Cassini%20Assembly/Cassini%20Assembly.glb" "$NASA_MODEL_DIR/cassini.glb"

if [[ -n "${NASA_API_KEY:-}" ]]; then
  echo "NASA_API_KEY detected; caching a couple of live API payloads."
  curl -LfsS "https://api.nasa.gov/planetary/earth/assets?lon=0&lat=0&dim=0.15&api_key=${NASA_API_KEY}" -o "$NASA_DIR/earth-assets.json" || true
  curl -LfsS "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_API_KEY}" -o "$NASA_DIR/mars-latest-photos.json" || true
fi

echo "NASA assets updated in $NASA_DIR"

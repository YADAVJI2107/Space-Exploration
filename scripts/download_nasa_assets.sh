#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NASA_DIR="$ROOT_DIR/frontend/public/nasa"

mkdir -p "$NASA_DIR"

download() {
  local url="$1"
  local target="$2"
  echo "Downloading $(basename "$target")"
  curl -LfsS "$url" -o "$target"
}

download "https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/image/apollo-11---view-of-the-moon/Apollo%2011%20-%20View%20of%20the%20Moon.jpg" "$NASA_DIR/moon-apollo11.jpg"
download "https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2022/10/STScI-01GFXQX1SG9AV3F2A2AHMV7HTA.png/jcr:content/renditions/cq5dam.web.1280.1280.png" "$NASA_DIR/pillars-of-creation.png"
download "https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2019/07/STScI-01EVSVD8TB93V5WMFJWPWZG41T.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg" "$NASA_DIR/spiral-galaxy-ngc3147.jpg"

if [[ -n "${NASA_API_KEY:-}" ]]; then
  echo "NASA_API_KEY detected; caching a couple of live API payloads."
  curl -LfsS "https://api.nasa.gov/planetary/earth/assets?lon=0&lat=0&dim=0.15&api_key=${NASA_API_KEY}" -o "$NASA_DIR/earth-assets.json" || true
  curl -LfsS "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_API_KEY}" -o "$NASA_DIR/mars-latest-photos.json" || true
fi

echo "NASA assets updated in $NASA_DIR"

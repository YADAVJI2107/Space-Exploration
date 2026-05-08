import os
import httpx
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

# NASA API Base URLs
NASA_API_BASE = "https://api.nasa.gov"
NASA_3D_RESOURCES_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/main"

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")


class NASAClient:
    """Client for fetching NASA data and resources."""

    def __init__(self, api_key: str = NASA_API_KEY):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        """Close the async client."""
        await self.client.aclose()

    async def get_earth_imagery(self):
        """Fetch Earth imagery and data from NASA Earth API."""
        try:
            url = f"{NASA_API_BASE}/planetary/earth/assets"
            params = {"lon": 0, "lat": 0, "dim": 0.15, "api_key": self.api_key}
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Earth imagery: {e}")
            return None

    async def get_mars_rover_images(self):
        """Fetch Mars rover images from NASA."""
        try:
            url = f"{NASA_API_BASE}/mars-photos/api/v1/rovers/curiosity/latest_photos"
            params = {"api_key": self.api_key}
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Mars rover images: {e}")
            return None

    async def get_solar_flare_data(self):
        """Fetch solar flare data from NASA DONKI API."""
        try:
            url = f"{NASA_API_BASE}/DONKI/flares"
            params = {"api_key": self.api_key}
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching solar flare data: {e}")
            return None

    @lru_cache(maxsize=1)
    def get_planet_resources_metadata(self):
        """
        Get metadata about available 3D models and resources for planets.
        This returns cached metadata about planet-related NASA resources.
        """
        return {
            "mercury": {
                "nasa_page": "https://science.nasa.gov/mercury/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Mercury is the smallest planet in our solar system and closest to the Sun.",
            },
            "venus": {
                "nasa_page": "https://science.nasa.gov/venus/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Venus is the hottest planet in our solar system despite being second from the Sun.",
            },
            "earth": {
                "nasa_page": "https://science.nasa.gov/earth/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    },
                    {
                        "name": "Earth Topography",
                        "url": "https://github.com/nasa/NASA-3D-Resources/blob/main/3D%20Models/Planetary%20Bodies/Earth.glb",
                        "format": "glb",
                    }
                ],
                "description": "Earth is our home planet and the only known planet to harbor life.",
            },
            "mars": {
                "nasa_page": "https://science.nasa.gov/mars/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Mars is known as the Red Planet and is a focus of human exploration.",
            },
            "jupiter": {
                "nasa_page": "https://science.nasa.gov/jupiter/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Jupiter is the largest planet in our solar system.",
            },
            "saturn": {
                "nasa_page": "https://science.nasa.gov/saturn/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Saturn is famous for its beautiful ring system.",
            },
            "uranus": {
                "nasa_page": "https://science.nasa.gov/uranus/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Uranus is an ice giant that rotates on its side.",
            },
            "neptune": {
                "nasa_page": "https://science.nasa.gov/neptune/",
                "3d_models": [
                    {
                        "name": "NASA 3D Resources Hub",
                        "url": "https://science.nasa.gov/3d-resources/",
                        "format": "catalog",
                    }
                ],
                "description": "Neptune is the windiest planet in our solar system.",
            },
        }

    async def validate_api_quota(self) -> dict:
        """Validate that the NASA API key has available quota."""
        try:
            url = f"{NASA_API_BASE}/planetary/apod"
            params = {"api_key": self.api_key}
            response = await self.client.head(url, params=params)

            return {
                "valid": response.status_code == 200,
                "limit": response.headers.get("x-ratelimit-limit"),
                "remaining": response.headers.get("x-ratelimit-remaining"),
            }
        except Exception as e:
            logger.error(f"Error validating API quota: {e}")
            return {"valid": False, "error": str(e)}


# Global NASA client instance
_nasa_client: NASAClient | None = None


def get_nasa_client() -> NASAClient:
    """Get or create the global NASA client instance."""
    global _nasa_client
    if _nasa_client is None:
        _nasa_client = NASAClient()
    return _nasa_client


async def close_nasa_client():
    """Close the global NASA client instance."""
    global _nasa_client
    if _nasa_client is not None:
        await _nasa_client.close()
        _nasa_client = None

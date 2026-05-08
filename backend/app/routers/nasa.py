from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.services.nasa_service import get_nasa_client

router = APIRouter(tags=["nasa"])


class NASAResourceMetadata(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    nasa_page: str
    three_d_models: list[dict]
    description: str


class NASAQuotaStatus(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    valid: bool
    limit: str | None = None
    remaining: str | None = None
    error: str | None = None


@router.get(
    "/nasa/planets/{planet_name}",
    response_model=NASAResourceMetadata,
    summary="Get NASA resources for a specific planet",
    description="Fetch NASA page links and available 3D models for a planet.",
)
async def get_planet_nasa_resources(planet_name: str) -> NASAResourceMetadata:
    """Get NASA resources and metadata for a planet."""
    nasa_client = get_nasa_client()
    metadata = nasa_client.get_planet_resources_metadata()

    planet_lower = planet_name.lower()
    if planet_lower not in metadata:
        raise HTTPException(status_code=404, detail=f"Planet '{planet_name}' not found in NASA resources")

    data = metadata[planet_lower]
    return NASAResourceMetadata(
        nasa_page=data["nasa_page"],
        three_d_models=data["3d_models"],
        description=data["description"],
    )


@router.get(
    "/nasa/quota",
    response_model=NASAQuotaStatus,
    summary="Check NASA API quota status",
    description="Validate that the NASA API key is valid and has available quota.",
)
async def check_nasa_quota() -> NASAQuotaStatus:
    """Check current NASA API quota status."""
    nasa_client = get_nasa_client()
    result = await nasa_client.validate_api_quota()
    return NASAQuotaStatus(**result)


@router.get(
    "/nasa/earth-imagery",
    summary="Get Earth satellite imagery",
    description="Fetch current Earth satellite imagery and metadata.",
)
async def get_earth_imagery():
    """Get Earth satellite imagery."""
    nasa_client = get_nasa_client()
    data = await nasa_client.get_earth_imagery()

    if not data:
        raise HTTPException(status_code=503, detail="Could not fetch Earth imagery from NASA")

    return data


@router.get(
    "/nasa/mars-rovers",
    summary="Get Mars rover images",
    description="Fetch recent images from Mars rovers.",
)
async def get_mars_rovers():
    """Get Mars rover images."""
    nasa_client = get_nasa_client()
    data = await nasa_client.get_mars_rover_images()

    if not data:
        raise HTTPException(status_code=503, detail="Could not fetch Mars rover data from NASA")

    return data

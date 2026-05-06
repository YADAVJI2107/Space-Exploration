from fastapi import APIRouter

from app.schemas.planet import Planet
from app.services.planet_service import list_planets

router = APIRouter(tags=["planets"])


@router.get("/planets", response_model=list[Planet])
def get_planets() -> list[Planet]:
    return list_planets()

from fastapi import APIRouter

from app.schemas.simulation import (
    SimulationConfig,
    SimulationUpdate,
    SimulationUpdateResponse,
)
from app.services.physics_service import compute_positions
from app.services.simulation_service import get_config, update_config

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.get("/config", response_model=SimulationConfig)
def simulation_config() -> SimulationConfig:
    return get_config()


@router.post("/update", response_model=SimulationUpdateResponse)
def update_simulation(payload: SimulationUpdate) -> SimulationUpdateResponse:
    config = update_config(payload)
    positions = None

    if payload.backend_driven or config.backend_driven:
        positions = compute_positions(payload.elapsed_days or 0)

    return SimulationUpdateResponse(config=config, positions=positions)

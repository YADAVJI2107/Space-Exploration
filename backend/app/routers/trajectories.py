from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Query

from app.schemas.trajectory import TrajectoryQuery, TrajectoryResponse
from app.services.trajectory_service import get_trajectories

router = APIRouter(prefix="/trajectories", tags=["trajectories"])


@router.get("/ephemeris", response_model=TrajectoryResponse)
async def ephemeris_trajectories(
    planets: list[str] | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    stop_date: datetime | None = Query(default=None),
    step: str = Query(default="1 d"),
    frame: str = Query(default="ecliptic"),
) -> TrajectoryResponse:
    start = start_date or datetime.now(UTC)
    stop = stop_date or (start + timedelta(days=7))
    query = TrajectoryQuery(
        planets=planets or [],
        start_date=start,
        stop_date=stop,
        step=step,
        frame=frame,
    )
    return await get_trajectories(query)

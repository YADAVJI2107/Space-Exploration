from __future__ import annotations

import logging
from datetime import datetime

from app.schemas.trajectory import PlanetTrajectory, TrajectoryQuery, TrajectoryResponse
from app.services.jpl_service import build_fallback_trajectory, get_jpl_client, parse_step_days
from app.services.planet_service import list_planets

logger = logging.getLogger(__name__)


async def get_trajectories(query: TrajectoryQuery) -> TrajectoryResponse:
    planet_names = query.planets or [planet.name for planet in list_planets()]
    normalized_names = [planet_name.lower() for planet_name in planet_names]
    known_names = {planet.name.lower(): planet.name for planet in list_planets()}
    resolved_names = [known_names[name] for name in normalized_names if name in known_names]

    trajectories: list[PlanetTrajectory] = []
    cached = True
    jpl_client = get_jpl_client()
    step_days = parse_step_days(query.step)

    for planet_name in resolved_names:
        try:
            trajectory, trajectory_cached = await jpl_client.get_planet_trajectory(
                planet_name=planet_name,
                start_date=query.start_date,
                stop_date=query.stop_date,
                step=query.step,
                frame=query.frame,
            )
            trajectories.append(trajectory)
            cached = cached and trajectory_cached
        except Exception as exc:
            logger.warning("Falling back to local trajectory for %s: %s", planet_name, exc)
            cached = False
            trajectories.append(
                build_fallback_trajectory(
                    planet_name=planet_name,
                    start_date=query.start_date,
                    stop_date=query.stop_date,
                    step_days=step_days,
                )
            )

    return TrajectoryResponse(
        start_date=query.start_date,
        stop_date=query.stop_date,
        step=query.step,
        frame=query.frame,
        cached=cached,
        trajectories=trajectories,
    )

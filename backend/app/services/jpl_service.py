from __future__ import annotations

import logging
import re
from datetime import UTC, datetime, timedelta

import httpx

from app.schemas.trajectory import PlanetTrajectory, TrajectoryPoint
from app.services.cache_service import get_cached_json, set_cached_json
from app.services.physics_service import compute_positions

logger = logging.getLogger(__name__)

HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
PLANET_COMMAND_IDS = {
    "mercury": "199",
    "venus": "299",
    "earth": "399",
    "mars": "499",
    "jupiter": "599",
    "saturn": "699",
    "uranus": "799",
    "neptune": "899",
}


class JPLClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=20.0)

    async def close(self) -> None:
        await self.client.aclose()

    async def get_planet_trajectory(
        self,
        *,
        planet_name: str,
        start_date: datetime,
        stop_date: datetime,
        step: str,
        frame: str,
    ) -> tuple[PlanetTrajectory, bool]:
        cache_key = self._cache_key(planet_name, start_date, stop_date, step, frame)
        cached = get_cached_json(cache_key)
        if cached is not None:
            return PlanetTrajectory.model_validate(cached), True

        command = PLANET_COMMAND_IDS.get(planet_name.lower())
        if command is None:
            raise ValueError(f"Unsupported planet '{planet_name}' for Horizons integration")

        params = {
            "format": "json",
            "COMMAND": f"'{command}'",
            "OBJ_DATA": "'NO'",
            "MAKE_EPHEM": "'YES'",
            "EPHEM_TYPE": "'VECTORS'",
            "CENTER": "'500@10'",
            "REF_PLANE": f"'{frame.upper()}'",
            "REF_SYSTEM": "'ICRF'",
            "OUT_UNITS": "'AU-D'",
            "VEC_TABLE": "'2'",
            "CSV_FORMAT": "'YES'",
            "START_TIME": f"'{start_date.strftime('%Y-%m-%d %H:%M')}'",
            "STOP_TIME": f"'{stop_date.strftime('%Y-%m-%d %H:%M')}'",
            "STEP_SIZE": f"'{step}'",
        }

        response = await self.client.get(HORIZONS_API_URL, params=params)
        response.raise_for_status()
        payload = response.json()
        if "result" not in payload:
            raise ValueError("Horizons response did not include result text")

        trajectory = PlanetTrajectory(
            name=planet_name,
            source="jpl-horizons",
            points=self._parse_vector_result(payload["result"]),
        )
        set_cached_json(
            cache_key,
            trajectory.model_dump(mode="json"),
            ttl_seconds=60 * 60 * 24,
            source="jpl-horizons",
        )
        return trajectory, False

    def _parse_vector_result(self, result_text: str) -> list[TrajectoryPoint]:
        match = re.search(r"\$\$SOE(.*?)\$\$EOE", result_text, re.DOTALL)
        if match is None:
            raise ValueError("Horizons response did not contain a data block")

        points: list[TrajectoryPoint] = []
        for raw_line in match.group(1).splitlines():
            line = raw_line.strip()
            if not line:
                continue

            columns = [column.strip() for column in line.split(",") if column.strip()]
            if len(columns) < 8:
                continue

            timestamp = self._parse_timestamp(columns[1])
            numeric_values: list[float] = []
            for value in columns:
                try:
                    numeric_values.append(float(value))
                except ValueError:
                    continue

            if len(numeric_values) < 7:
                continue

            x, y, z, vx, vy, vz = numeric_values[-6:]
            points.append(
                TrajectoryPoint(
                    at=timestamp,
                    x=x,
                    y=y,
                    z=z,
                    vx=vx,
                    vy=vy,
                    vz=vz,
                )
            )

        if not points:
            raise ValueError("Horizons response did not yield trajectory points")

        return points

    @staticmethod
    def _parse_timestamp(value: str) -> datetime:
        normalized = " ".join(value.split())
        for fmt in ("%Y-%b-%d %H:%M:%S.%f", "A.D. %Y-%b-%d %H:%M:%S.%f"):
            try:
                return datetime.strptime(normalized, fmt).replace(tzinfo=UTC)
            except ValueError:
                continue
        raise ValueError(f"Unable to parse Horizons timestamp '{value}'")

    @staticmethod
    def _cache_key(
        planet_name: str,
        start_date: datetime,
        stop_date: datetime,
        step: str,
        frame: str,
    ) -> str:
        return "|".join(
            [
                "jpl",
                planet_name.lower(),
                start_date.isoformat(),
                stop_date.isoformat(),
                step.lower(),
                frame.lower(),
            ]
        )


_jpl_client: JPLClient | None = None


def get_jpl_client() -> JPLClient:
    global _jpl_client
    if _jpl_client is None:
        _jpl_client = JPLClient()
    return _jpl_client


async def close_jpl_client() -> None:
    global _jpl_client
    if _jpl_client is not None:
        await _jpl_client.close()
        _jpl_client = None


def build_fallback_trajectory(
    *,
    planet_name: str,
    start_date: datetime,
    stop_date: datetime,
    step_days: int,
) -> PlanetTrajectory:
    points: list[TrajectoryPoint] = []
    total_days = max(int((stop_date - start_date).total_seconds() / 86400), 0)

    for elapsed_days in range(0, total_days + 1, step_days):
        for position in compute_positions(float(elapsed_days)):
            if position.name.lower() != planet_name.lower():
                continue

            points.append(
                TrajectoryPoint(
                    at=start_date + timedelta(days=elapsed_days),
                    x=position.x,
                    y=position.y,
                    z=position.z,
                )
            )
            break

    return PlanetTrajectory(name=planet_name, source="kepler-fallback", points=points)


def parse_step_days(step: str) -> int:
    match = re.match(r"^\s*(\d+)\s*d\s*$", step, re.IGNORECASE)
    if match is None:
        raise ValueError("Only day-based step sizes like '1 d' are currently supported")
    return max(int(match.group(1)), 1)

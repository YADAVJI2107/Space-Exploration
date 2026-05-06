import math

from app.schemas.simulation import PlanetPosition
from app.services.planet_service import list_planets


def _solve_kepler(mean_anomaly: float, eccentricity: float) -> float:
    eccentric_anomaly = mean_anomaly if eccentricity < 0.8 else math.pi

    for _ in range(8):
        numerator = eccentric_anomaly - eccentricity * math.sin(eccentric_anomaly) - mean_anomaly
        denominator = 1 - eccentricity * math.cos(eccentric_anomaly)
        eccentric_anomaly -= numerator / denominator

    return eccentric_anomaly


def _rotate_y(x: float, y: float, z: float, angle: float) -> tuple[float, float, float]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return (x * cosine + z * sine, y, -x * sine + z * cosine)


def _rotate_x(x: float, y: float, z: float, angle: float) -> tuple[float, float, float]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return (x, y * cosine - z * sine, y * sine + z * cosine)


def compute_positions(elapsed_days: float) -> list[PlanetPosition]:
    positions: list[PlanetPosition] = []

    for planet in list_planets():
        mean_anomaly = math.radians(planet.phase + planet.orbit_speed * elapsed_days) % (math.pi * 2)
        eccentric_anomaly = _solve_kepler(mean_anomaly, planet.eccentricity)
        true_anomaly = 2 * math.atan2(
            math.sqrt(1 + planet.eccentricity) * math.sin(eccentric_anomaly / 2),
            math.sqrt(1 - planet.eccentricity) * math.cos(eccentric_anomaly / 2),
        )
        orbital_radius = planet.orbit_radius * (
            1 - planet.eccentricity * math.cos(eccentric_anomaly)
        )
        x = orbital_radius * math.cos(true_anomaly)
        y = 0
        z = orbital_radius * math.sin(true_anomaly)

        x, y, z = _rotate_y(x, y, z, math.radians(planet.argument_of_periapsis))
        x, y, z = _rotate_x(x, y, z, math.radians(planet.inclination))
        x, y, z = _rotate_y(x, y, z, math.radians(planet.longitude_of_ascending_node))

        positions.append(PlanetPosition(name=planet.name, x=x, y=y, z=z))

    return positions

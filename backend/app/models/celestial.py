from dataclasses import dataclass


@dataclass(frozen=True)
class OrbitalElements:
    semi_major_axis: float
    eccentricity: float
    inclination: float
    longitude_of_ascending_node: float
    argument_of_periapsis: float
    phase: float
    orbit_speed: float

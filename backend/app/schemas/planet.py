from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Planet(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    radius: float = Field(description="Planet radius relative to Earth.")
    display_radius: float = Field(description="Compressed render radius used by the frontend scene.")
    orbit_radius: float = Field(description="Compressed render semi-major axis.")
    semi_major_axis_au: float
    eccentricity: float
    inclination: float
    longitude_of_ascending_node: float
    argument_of_periapsis: float
    phase: float
    orbit_speed: float = Field(description="Mean motion in degrees per Earth day.")
    sidereal_period_days: float
    rotation_speed: float = Field(description="Axial rotations per Earth day. Negative is retrograde.")
    rotation_period_hours: float
    axial_tilt: float
    mass: float
    color: str
    texture_url: str
    ring_texture_url: str | None = None
    has_rings: bool = False
    moon_count: int = 0
    featured_moons: list[str] = Field(default_factory=list)
    orbital_velocity_km_s: float
    description: str

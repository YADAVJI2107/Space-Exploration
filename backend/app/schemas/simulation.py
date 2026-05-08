from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class SimulationConfig(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    time_scale: float = Field(default=8, ge=0.1, le=1000)
    gravitational_constant: float = 6.67430e-11
    galactic_speed: float = Field(default=0.08, ge=0, le=5)
    gravity_scale: float = Field(default=1, ge=0.1, le=10)
    backend_driven: bool = False
    n_body_enabled: bool = False
    show_orbits: bool = True
    paused: bool = False


class SimulationUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    time_scale: float | None = Field(default=None, ge=0.1, le=1000)
    galactic_speed: float | None = Field(default=None, ge=0, le=5)
    gravity_scale: float | None = Field(default=None, ge=0.1, le=10)
    backend_driven: bool | None = None
    n_body_enabled: bool | None = None
    show_orbits: bool | None = None
    paused: bool | None = None
    elapsed_days: float | None = None


class PlanetPosition(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    x: float
    y: float
    z: float


class SimulationUpdateResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    config: SimulationConfig
    positions: list[PlanetPosition] | None = None

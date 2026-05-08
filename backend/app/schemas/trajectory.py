from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class TrajectoryPoint(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    at: datetime
    x: float
    y: float
    z: float
    vx: float | None = None
    vy: float | None = None
    vz: float | None = None


class PlanetTrajectory(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str
    source: str
    points: list[TrajectoryPoint]


class TrajectoryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    start_date: datetime
    stop_date: datetime
    step: str
    frame: str
    cached: bool
    trajectories: list[PlanetTrajectory]


class TrajectoryQuery(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    planets: list[str] = Field(default_factory=list)
    start_date: datetime
    stop_date: datetime
    step: str = Field(default="1 d", min_length=2, max_length=16)
    frame: str = Field(default="ecliptic", min_length=3, max_length=20)

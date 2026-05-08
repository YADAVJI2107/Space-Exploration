from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class SessionCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(default="Explorer Session", min_length=1, max_length=80)


class SessionUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(default=None, min_length=1, max_length=80)
    selected_planet: str | None = None
    view_mode: str | None = None
    time_scale: float | None = Field(default=None, ge=0.1, le=1000)
    paused: bool | None = None
    backend_driven: bool | None = None
    n_body_enabled: bool | None = None
    gravity_scale: float | None = Field(default=None, ge=0.1, le=10)
    show_orbits: bool | None = None


class SessionState(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    selected_planet: str
    view_mode: str
    time_scale: float
    paused: bool
    backend_driven: bool
    n_body_enabled: bool
    gravity_scale: float
    show_orbits: bool
    favorites: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class SessionFavoriteResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    session_id: str
    favorites: list[str]

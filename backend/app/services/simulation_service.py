from app.schemas.simulation import SimulationConfig, SimulationUpdate

_config = SimulationConfig()


def get_config() -> SimulationConfig:
    return _config


def update_config(payload: SimulationUpdate) -> SimulationConfig:
    global _config

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    updates.pop("elapsed_days", None)

    if updates:
        _config = _config.model_copy(update=updates)

    return _config

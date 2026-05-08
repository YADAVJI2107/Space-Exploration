import os
from pathlib import Path

from fastapi.testclient import TestClient

os.environ["SPACE_APP_DB_PATH"] = str(Path(__file__).resolve().parent / "test_space_app.db")

from app.db import init_db
from app.main import app

init_db()

client = TestClient(app)


def test_simulation_config_uses_camel_case_contract() -> None:
    response = client.get("/simulation/config")

    assert response.status_code == 200
    payload = response.json()
    assert "timeScale" in payload
    assert "gravityScale" in payload
    assert "nBodyEnabled" in payload


def test_simulation_update_round_trips_gravity_scale() -> None:
    response = client.post(
        "/simulation/update",
        json={"gravityScale": 1.35, "nBodyEnabled": True, "showOrbits": False},
    )

    assert response.status_code == 200
    config = response.json()["config"]
    assert config["gravityScale"] == 1.35
    assert config["nBodyEnabled"] is True
    assert config["showOrbits"] is False


def test_session_persistence_and_favorites() -> None:
    created = client.post("/sessions", json={"name": "Test Session"})

    assert created.status_code == 200
    session = created.json()
    session_id = session["id"]
    assert session["selectedPlanet"] == "Earth"
    assert session["favorites"] == []

    updated = client.patch(
        f"/sessions/{session_id}",
        json={"selectedPlanet": "Mars", "timeScale": 120, "viewMode": "free"},
    )

    assert updated.status_code == 200
    updated_session = updated.json()
    assert updated_session["selectedPlanet"] == "Mars"
    assert updated_session["timeScale"] == 120
    assert updated_session["viewMode"] == "free"

    favorite = client.post(f"/sessions/{session_id}/favorites/Mars")
    assert favorite.status_code == 200
    assert favorite.json()["favorites"] == ["Mars"]

    fetched = client.get(f"/sessions/{session_id}")
    assert fetched.status_code == 200
    assert fetched.json()["favorites"] == ["Mars"]


def test_trajectory_endpoint_falls_back_when_jpl_unavailable(monkeypatch) -> None:
    async def raise_error(self, **_kwargs):
        raise RuntimeError("network unavailable")

    from app.services import jpl_service

    monkeypatch.setattr(jpl_service.JPLClient, "get_planet_trajectory", raise_error)

    response = client.get(
        "/trajectories/ephemeris",
        params={
            "planets": ["Earth"],
            "start_date": "2026-05-08T00:00:00Z",
            "stop_date": "2026-05-10T00:00:00Z",
            "step": "1 d",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["cached"] is False
    assert payload["trajectories"][0]["name"] == "Earth"
    assert payload["trajectories"][0]["source"] == "kepler-fallback"
    assert len(payload["trajectories"][0]["points"]) == 3

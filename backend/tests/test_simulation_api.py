from fastapi.testclient import TestClient

from app.main import app


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

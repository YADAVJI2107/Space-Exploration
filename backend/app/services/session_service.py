from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException

from app.db import get_db_connection
from app.schemas.session import SessionState, SessionUpdateRequest


def _default_session_payload(name: str) -> dict[str, object]:
    now = datetime.now(UTC).isoformat()
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "selected_planet": "Earth",
        "view_mode": "system",
        "time_scale": 8.0,
        "paused": 0,
        "backend_driven": 0,
        "n_body_enabled": 0,
        "gravity_scale": 1.0,
        "show_orbits": 1,
        "created_at": now,
        "updated_at": now,
    }


def _favorites_for_session(session_id: str) -> list[str]:
    with get_db_connection() as connection:
        rows = connection.execute(
            "SELECT planet_name FROM favorites WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        ).fetchall()
    return [row["planet_name"] for row in rows]


def _row_to_session(row) -> SessionState:
    return SessionState(
        id=row["id"],
        name=row["name"],
        selected_planet=row["selected_planet"],
        view_mode=row["view_mode"],
        time_scale=row["time_scale"],
        paused=bool(row["paused"]),
        backend_driven=bool(row["backend_driven"]),
        n_body_enabled=bool(row["n_body_enabled"]),
        gravity_scale=row["gravity_scale"],
        show_orbits=bool(row["show_orbits"]),
        favorites=_favorites_for_session(row["id"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def create_session(name: str) -> SessionState:
    payload = _default_session_payload(name)

    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO sessions (
                id, name, selected_planet, view_mode, time_scale, paused,
                backend_driven, n_body_enabled, gravity_scale, show_orbits,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload["id"],
                payload["name"],
                payload["selected_planet"],
                payload["view_mode"],
                payload["time_scale"],
                payload["paused"],
                payload["backend_driven"],
                payload["n_body_enabled"],
                payload["gravity_scale"],
                payload["show_orbits"],
                payload["created_at"],
                payload["updated_at"],
            ),
        )

        row = connection.execute("SELECT * FROM sessions WHERE id = ?", (payload["id"],)).fetchone()

    return _row_to_session(row)


def get_session(session_id: str) -> SessionState:
    with get_db_connection() as connection:
        row = connection.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    return _row_to_session(row)


def update_session(session_id: str, payload: SessionUpdateRequest) -> SessionState:
    existing = get_session(session_id)
    updates = payload.model_dump(exclude_unset=True, exclude_none=True)

    if not updates:
        return existing

    normalized = {
        "name": updates.get("name", existing.name),
        "selected_planet": updates.get("selected_planet", existing.selected_planet),
        "view_mode": updates.get("view_mode", existing.view_mode),
        "time_scale": updates.get("time_scale", existing.time_scale),
        "paused": int(updates.get("paused", existing.paused)),
        "backend_driven": int(updates.get("backend_driven", existing.backend_driven)),
        "n_body_enabled": int(updates.get("n_body_enabled", existing.n_body_enabled)),
        "gravity_scale": updates.get("gravity_scale", existing.gravity_scale),
        "show_orbits": int(updates.get("show_orbits", existing.show_orbits)),
        "updated_at": datetime.now(UTC).isoformat(),
    }

    with get_db_connection() as connection:
        connection.execute(
            """
            UPDATE sessions
            SET name = ?, selected_planet = ?, view_mode = ?, time_scale = ?,
                paused = ?, backend_driven = ?, n_body_enabled = ?,
                gravity_scale = ?, show_orbits = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                normalized["name"],
                normalized["selected_planet"],
                normalized["view_mode"],
                normalized["time_scale"],
                normalized["paused"],
                normalized["backend_driven"],
                normalized["n_body_enabled"],
                normalized["gravity_scale"],
                normalized["show_orbits"],
                normalized["updated_at"],
                session_id,
            ),
        )

    return get_session(session_id)


def add_favorite(session_id: str, planet_name: str) -> list[str]:
    get_session(session_id)
    now = datetime.now(UTC).isoformat()

    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT OR IGNORE INTO favorites (session_id, planet_name, created_at)
            VALUES (?, ?, ?)
            """,
            (session_id, planet_name, now),
        )

    return _favorites_for_session(session_id)


def remove_favorite(session_id: str, planet_name: str) -> list[str]:
    get_session(session_id)

    with get_db_connection() as connection:
        connection.execute(
            "DELETE FROM favorites WHERE session_id = ? AND planet_name = ?",
            (session_id, planet_name),
        )

    return _favorites_for_session(session_id)

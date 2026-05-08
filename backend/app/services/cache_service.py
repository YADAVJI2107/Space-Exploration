from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

from app.db import get_db_connection


def get_cached_json(cache_key: str) -> dict[str, Any] | None:
    with get_db_connection() as connection:
        row = connection.execute(
            "SELECT payload, expires_at FROM cache_entries WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()

        if row is None:
            return None

        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at <= datetime.now(UTC):
            connection.execute("DELETE FROM cache_entries WHERE cache_key = ?", (cache_key,))
            return None

        return json.loads(row["payload"])


def set_cached_json(
    cache_key: str,
    payload: dict[str, Any],
    *,
    ttl_seconds: int,
    source: str,
) -> None:
    now = datetime.now(UTC)
    expires_at = now + timedelta(seconds=ttl_seconds)

    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO cache_entries (cache_key, source, payload, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                source = excluded.source,
                payload = excluded.payload,
                expires_at = excluded.expires_at,
                created_at = excluded.created_at
            """,
            (
                cache_key,
                source,
                json.dumps(payload),
                expires_at.isoformat(),
                now.isoformat(),
            ),
        )

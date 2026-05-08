from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


def get_database_path() -> Path:
    configured = os.getenv("SPACE_APP_DB_PATH")
    if configured:
        return Path(configured)

    return Path(__file__).resolve().parent.parent / "data" / "space_app.db"


def init_db() -> None:
    db_path = get_database_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_path) as connection:
        connection.execute("PRAGMA journal_mode=WAL;")
        connection.execute("PRAGMA foreign_keys=ON;")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                selected_planet TEXT NOT NULL,
                view_mode TEXT NOT NULL,
                time_scale REAL NOT NULL,
                paused INTEGER NOT NULL,
                backend_driven INTEGER NOT NULL,
                n_body_enabled INTEGER NOT NULL,
                gravity_scale REAL NOT NULL,
                show_orbits INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS favorites (
                session_id TEXT NOT NULL,
                planet_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (session_id, planet_name),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS cache_entries (
                cache_key TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                payload TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


@contextmanager
def get_db_connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(get_database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON;")

    try:
        yield connection
        connection.commit()
    finally:
        connection.close()

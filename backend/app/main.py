import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import nasa, planets, simulation, sessions, trajectories
from app.services.jpl_service import close_jpl_client
from app.services.nasa_service import close_nasa_client

logger = logging.getLogger("space_api")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI(
    title="3D Space Exploration Simulation API",
    version="1.0.0",
    description="Planet constants, simulation configuration, and simplified orbital physics.",
    root_path=os.getenv("FASTAPI_ROOT_PATH", ""),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(planets.router)
app.include_router(simulation.router)
app.include_router(nasa.router)
app.include_router(sessions.router)
app.include_router(trajectories.router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "%s %s -> %s in %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    init_db()


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    await close_nasa_client()
    await close_jpl_client()

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import planets, simulation

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


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}

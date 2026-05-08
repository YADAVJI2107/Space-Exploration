import { fallbackPlanets, fallbackSimulationConfig } from "@/lib/planet-data";
import type {
  Planet,
  PlanetTrajectory,
  SessionState,
  SimulationConfig
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export type ApiDataSource = "api" | "fallback";

export interface ApiResult<T> {
  data: T;
  source: ApiDataSource;
  error?: string;
}

export interface NASAResource {
  nasaPage: string;
  threeDModels: Array<{ name: string; url: string; format: string }>;
  description: string;
}

export interface NasaEarthImagery {
  date?: string;
  id?: string;
  resource?: { dataset?: string; planet?: string };
  serviceVersion?: string;
  url?: string;
}

export interface NasaMarsRovers {
  latest_photos?: Array<{
    id: number;
    earth_date: string;
    img_src: string;
    camera?: { full_name?: string; name?: string };
    rover?: { name?: string; status?: string };
  }>;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown API error";
}

async function getJson<T>(path: string, fallback: T): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return { data: (await response.json()) as T, source: "api" };
  } catch (error) {
    return { data: fallback, source: "fallback", error: errorMessage(error) };
  }
}

export function fetchPlanets() {
  return getJson<Planet[]>("/planets", fallbackPlanets);
}

export function fetchSimulationConfig() {
  return getJson<SimulationConfig>("/simulation/config", fallbackSimulationConfig);
}

export async function updateSimulationConfig(update: Partial<SimulationConfig>) {
  try {
    const response = await fetch(`${API_BASE}/simulation/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as { config: SimulationConfig };
  } catch {
    return { config: { ...fallbackSimulationConfig, ...update } };
  }
}

export function fetchPlanetNasaResources(planetName: string) {
  return getJson<NASAResource>(`/nasa/planets/${planetName}`, {
    nasaPage: "",
    threeDModels: [],
    description: ""
  });
}

export function fetchEarthImagery() {
  return getJson<NasaEarthImagery>("/nasa/earth-imagery", {});
}

export function fetchMarsRovers() {
  return getJson<NasaMarsRovers>("/nasa/mars-rovers", {});
}

export async function createSession(name = "Explorer Session") {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    throw new Error(`Session creation failed with ${response.status}`);
  }

  return (await response.json()) as SessionState;
}

export async function fetchSession(sessionId: string) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Session fetch failed with ${response.status}`);
  }

  return (await response.json()) as SessionState;
}

export async function updateSession(
  sessionId: string,
  update: Partial<
    Pick<
      SessionState,
      | "name"
      | "selectedPlanet"
      | "viewMode"
      | "timeScale"
      | "paused"
      | "backendDriven"
      | "nBodyEnabled"
      | "gravityScale"
      | "showOrbits"
    >
  >
) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(update)
  });

  if (!response.ok) {
    throw new Error(`Session update failed with ${response.status}`);
  }

  return (await response.json()) as SessionState;
}

export async function addFavorite(sessionId: string, planetName: string) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/favorites/${planetName}`, {
    method: "POST",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Favorite add failed with ${response.status}`);
  }

  return (await response.json()) as { sessionId: string; favorites: string[] };
}

export async function removeFavorite(sessionId: string, planetName: string) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/favorites/${planetName}`, {
    method: "DELETE",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Favorite delete failed with ${response.status}`);
  }

  return (await response.json()) as { sessionId: string; favorites: string[] };
}

export async function fetchEphemerisPreview(planetNames: string[]) {
  const params = new URLSearchParams();
  planetNames.forEach((planet) => params.append("planets", planet));
  const response = await fetch(`${API_BASE}/trajectories/ephemeris?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Ephemeris fetch failed with ${response.status}`);
  }

  return (await response.json()) as {
    cached: boolean;
    trajectories: PlanetTrajectory[];
  };
}

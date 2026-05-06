import { fallbackPlanets, fallbackSimulationConfig } from "@/lib/planet-data";
import type { Planet, SimulationConfig } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
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

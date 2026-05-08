import type { ExplorationDestination } from "@/lib/types";

export const explorationDestinations: ExplorationDestination[] = [
  {
    id: "solar-system",
    name: "Solar System",
    kind: "solar-system",
    description: "The fully simulated local system with live planets, moons, telemetry, and follow mode.",
    position: [0, 0, 0],
    accentColor: "#7dd3fc",
    scale: 1.3,
    orbitingBodies: 8
  },
  {
    id: "alpha-centauri",
    name: "Alpha Centauri",
    kind: "star-system",
    description: "A nearby triple-star neighborhood represented here as a warm stellar cluster with orbit guides.",
    position: [64, 12, -28],
    accentColor: "#fbbf24",
    scale: 0.95,
    orbitingBodies: 3
  },
  {
    id: "trappist-1",
    name: "TRAPPIST-1",
    kind: "star-system",
    description: "A compact exoplanetary system highlighted as a dense red-dwarf destination for deep-space exploration.",
    position: [-58, -8, 22],
    accentColor: "#fb7185",
    scale: 0.86,
    orbitingBodies: 7
  },
  {
    id: "orion-nebula",
    name: "Orion Nursery",
    kind: "star-system",
    description: "A star-forming region rendered as a bright nursery cloud with embedded newborn stars.",
    position: [24, 22, 58],
    accentColor: "#67e8f9",
    scale: 1.1,
    orbitingBodies: 5
  },
  {
    id: "andromeda-vista",
    name: "Andromeda Vista",
    kind: "galaxy",
    description: "A distant galactic landmark that gives the scene a larger sense of place beyond the Milky Way.",
    position: [-92, 34, -84],
    accentColor: "#c4b5fd",
    scale: 2.4,
    orbitingBodies: 0
  }
];

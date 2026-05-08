import type { ExplorationDestination } from "@/lib/types";

export const explorationDestinations: ExplorationDestination[] = [
  {
    id: "local-group",
    name: "Local Group",
    kind: "overview",
    description: "A wide exploration map of the nearby galactic neighborhood. This view keeps the Milky Way, Andromeda, and Triangulum separated so their relative positions read as destinations rather than background decoration.",
    position: [0, 0, 0],
    accentColor: "#8be9fd",
    scale: 1,
    orbitingBodies: 0,
    focusDistance: 280,
    label: "Overview"
  },
  {
    id: "milky-way",
    name: "Milky Way",
    kind: "galaxy",
    description: "The Milky Way is a barred spiral galaxy containing hundreds of billions of stars, dark dust lanes, nebulae, stellar nurseries, and the Solar System. In this app it acts as the home galaxy, with the detailed Solar System embedded as the primary explorable node.",
    position: [0, -18, 0],
    accentColor: "#8bb6ff",
    scale: 54,
    orbitingBodies: 0,
    parentId: "local-group",
    focusDistance: 86,
    label: "Home galaxy"
  },
  {
    id: "andromeda",
    name: "Andromeda",
    kind: "galaxy",
    description: "Andromeda, also known as M31, is the largest major galaxy near the Milky Way and is moving toward us on a future merger path. It is shown as a separate spiral destination with its own waypoint so exploration can expand beyond the home galaxy.",
    position: [360, 80, -340],
    accentColor: "#b8c3ff",
    scale: 68,
    orbitingBodies: 0,
    parentId: "local-group",
    focusDistance: 106
  },
  {
    id: "triangulum",
    name: "Triangulum",
    kind: "galaxy",
    description: "Triangulum, or M33, is a smaller spiral galaxy in the Local Group. Its lower scale and wider separation make it feel like a distant companion rather than another object orbiting the Solar System.",
    position: [-340, 66, -280],
    accentColor: "#7dd3fc",
    scale: 44,
    orbitingBodies: 0,
    parentId: "local-group",
    focusDistance: 82
  },
  {
    id: "solar-system",
    name: "Solar System",
    kind: "solar-system",
    description: "The Solar System node opens the detailed planet simulation: rocky inner worlds, gas giants, ice giants, moons, rings, and NASA spacecraft markers all scaled for readable exploration rather than literal astronomical distance.",
    position: [0, 9, 8],
    accentColor: "#7dd3fc",
    scale: 10,
    orbitingBodies: 8,
    parentId: "milky-way",
    focusDistance: 38
  },
  {
    id: "alpha-centauri",
    name: "Alpha Centauri",
    kind: "star-system",
    description: "A nearby stellar neighborhood represented as a warm triple-star waypoint branching off the Milky Way disk.",
    position: [86, 12, -46],
    accentColor: "#fbbf24",
    scale: 9,
    orbitingBodies: 3,
    parentId: "milky-way",
    focusDistance: 34
  },
  {
    id: "trappist-1",
    name: "TRAPPIST-1",
    kind: "star-system",
    description: "A compact exoplanet system rendered as a dense red-dwarf cluster deeper inside the home galaxy.",
    position: [-96, -2, 58],
    accentColor: "#fb7185",
    scale: 8,
    orbitingBodies: 7,
    parentId: "milky-way",
    focusDistance: 32
  },
  {
    id: "orion-station",
    name: "Orion Research Reach",
    kind: "star-system",
    description: "A science-rich nursery zone with station markers and young stars that serve as a deep-space exploration stop.",
    position: [42, 24, 82],
    accentColor: "#67e8f9",
    scale: 10,
    orbitingBodies: 5,
    parentId: "milky-way",
    focusDistance: 40
  },
  {
    id: "m31-crown",
    name: "M31 Crown Fields",
    kind: "star-system",
    description: "A scenic Andromeda waypoint with wide orbital spacing to make exploration feel calmer and more legible.",
    position: [388, 86, -284],
    accentColor: "#ddd6fe",
    scale: 9,
    orbitingBodies: 4,
    parentId: "andromeda",
    focusDistance: 36
  },
  {
    id: "m33-drift",
    name: "M33 Drift Line",
    kind: "star-system",
    description: "A remote Triangulum route with sparse bodies and long spacing, useful for open-space navigation.",
    position: [-314, 72, -236],
    accentColor: "#93c5fd",
    scale: 8,
    orbitingBodies: 3,
    parentId: "triangulum",
    focusDistance: 34
  }
];

export const explorationDestinationMap = Object.fromEntries(
  explorationDestinations.map((destination) => [destination.id, destination])
) as Record<string, ExplorationDestination>;

export const galaxyDestinations = explorationDestinations.filter((destination) => destination.kind === "galaxy");

export const systemDestinations = explorationDestinations.filter(
  (destination) => destination.kind === "solar-system" || destination.kind === "star-system"
);

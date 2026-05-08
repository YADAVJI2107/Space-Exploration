export type ViewMode = "system" | "free";

export interface Planet {
  name: string;
  radius: number;
  displayRadius: number;
  orbitRadius: number;
  semiMajorAxisAu: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  phase: number;
  orbitSpeed: number;
  siderealPeriodDays: number;
  rotationSpeed: number;
  rotationPeriodHours: number;
  axialTilt: number;
  mass: number;
  color: string;
  textureUrl: string;
  ringTextureUrl?: string | null;
  hasRings: boolean;
  moonCount: number;
  featuredMoons: string[];
  orbitalVelocityKmS: number;
  description: string;
}

export interface SimulationConfig {
  timeScale: number;
  gravitationalConstant: number;
  galacticSpeed: number;
  gravityScale: number;
  backendDriven: boolean;
  nBodyEnabled: boolean;
  showOrbits: boolean;
  paused: boolean;
}

export interface PlanetPosition {
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface SessionState {
  id: string;
  name: string;
  selectedPlanet: string;
  viewMode: ViewMode;
  timeScale: number;
  paused: boolean;
  backendDriven: boolean;
  nBodyEnabled: boolean;
  gravityScale: number;
  showOrbits: boolean;
  favorites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrajectoryPoint {
  at: string;
  x: number;
  y: number;
  z: number;
  vx?: number | null;
  vy?: number | null;
  vz?: number | null;
}

export interface PlanetTrajectory {
  name: string;
  source: string;
  points: TrajectoryPoint[];
}

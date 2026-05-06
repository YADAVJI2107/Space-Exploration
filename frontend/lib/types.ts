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
  orbitalVelocityKmS: number;
  description: string;
}

export interface SimulationConfig {
  timeScale: number;
  gravitationalConstant: number;
  galacticSpeed: number;
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

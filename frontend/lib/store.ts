import { create } from "zustand";
import type { ViewMode } from "@/lib/types";

interface SimulationState {
  timeScale: number;
  isPaused: boolean;
  viewMode: ViewMode;
  selectedPlanet: string;
  followTarget: string | null;
  selectedDestination: string;
  showOrbits: boolean;
  nBodyEnabled: boolean;
  gravityScale: number;
  showGalaxy: boolean;
  showNebula: boolean;
  showDust: boolean;
  setTimeScale: (timeScale: number) => void;
  setPaused: (isPaused: boolean) => void;
  togglePaused: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  selectPlanet: (planet: string) => void;
  setFollowTarget: (planet: string | null) => void;
  setSelectedDestination: (destination: string) => void;
  setShowOrbits: (showOrbits: boolean) => void;
  setNBodyEnabled: (nBodyEnabled: boolean) => void;
  setGravityScale: (gravityScale: number) => void;
  setShowGalaxy: (showGalaxy: boolean) => void;
  setShowNebula: (showNebula: boolean) => void;
  setShowDust: (showDust: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  timeScale: 8,
  isPaused: false,
  viewMode: "free",
  selectedPlanet: "Earth",
  followTarget: null,
  selectedDestination: "local-group",
  showOrbits: true,
  nBodyEnabled: false,
  gravityScale: 1,
  showGalaxy: true,
  showNebula: true,
  showDust: true,
  setTimeScale: (timeScale) => set({ timeScale }),
  setPaused: (isPaused) => set({ isPaused }),
  togglePaused: () => set((state) => ({ isPaused: !state.isPaused })),
  setViewMode: (viewMode) =>
    set((state) => ({
      viewMode,
      selectedDestination:
        viewMode === "planet"
          ? "solar-system"
          : viewMode === "galactic"
            ? state.selectedDestination === "solar-system"
              ? "milky-way"
              : state.selectedDestination
            : state.selectedDestination,
      followTarget:
        viewMode === "free" || viewMode === "planet" || viewMode === "galactic"
          ? null
          : state.followTarget ?? state.selectedPlanet
    })),
  selectPlanet: (planet) =>
    set({ selectedPlanet: planet, followTarget: planet, selectedDestination: "solar-system" }),
  setFollowTarget: (planet) => set({ followTarget: planet }),
  setSelectedDestination: (selectedDestination) =>
    set((state) => ({
      selectedDestination,
      followTarget:
        state.viewMode === "galactic"
          ? null
          : selectedDestination === "solar-system"
            ? state.selectedPlanet
            : null,
      viewMode:
        state.viewMode === "galactic"
          ? "galactic"
          : selectedDestination === "solar-system"
            ? "system"
            : "free"
    })),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setNBodyEnabled: (nBodyEnabled) => set({ nBodyEnabled }),
  setGravityScale: (gravityScale) => set({ gravityScale }),
  setShowGalaxy: (showGalaxy) => set({ showGalaxy }),
  setShowNebula: (showNebula) => set({ showNebula }),
  setShowDust: (showDust) => set({ showDust })
}));

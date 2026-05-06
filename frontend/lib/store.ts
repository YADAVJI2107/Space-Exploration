import { create } from "zustand";
import type { ViewMode } from "@/lib/types";

interface SimulationState {
  timeScale: number;
  isPaused: boolean;
  viewMode: ViewMode;
  selectedPlanet: string;
  followTarget: string | null;
  showOrbits: boolean;
  nBodyEnabled: boolean;
  setTimeScale: (timeScale: number) => void;
  setPaused: (isPaused: boolean) => void;
  togglePaused: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  selectPlanet: (planet: string) => void;
  setFollowTarget: (planet: string | null) => void;
  setShowOrbits: (showOrbits: boolean) => void;
  setNBodyEnabled: (nBodyEnabled: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  timeScale: 45,
  isPaused: false,
  viewMode: "system",
  selectedPlanet: "Earth",
  followTarget: "Earth",
  showOrbits: true,
  nBodyEnabled: false,
  setTimeScale: (timeScale) => set({ timeScale }),
  setPaused: (isPaused) => set({ isPaused }),
  togglePaused: () => set((state) => ({ isPaused: !state.isPaused })),
  setViewMode: (viewMode) =>
    set((state) => ({
      viewMode,
      followTarget: viewMode === "free" ? null : state.followTarget ?? state.selectedPlanet
    })),
  selectPlanet: (planet) => set({ selectedPlanet: planet, followTarget: planet }),
  setFollowTarget: (planet) => set({ followTarget: planet }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setNBodyEnabled: (nBodyEnabled) => set({ nBodyEnabled })
}));

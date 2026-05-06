"use client";

import { useEffect, useState } from "react";
import { fetchPlanets, fetchSimulationConfig } from "@/lib/api";
import { fallbackPlanets, fallbackSimulationConfig } from "@/lib/planet-data";
import { useSimulationStore } from "@/lib/store";
import type { Planet, SimulationConfig } from "@/lib/types";

export function useSpaceData() {
  const [planets, setPlanets] = useState<Planet[]>(fallbackPlanets);
  const [config, setConfig] = useState<SimulationConfig>(fallbackSimulationConfig);
  const [isLoading, setIsLoading] = useState(true);
  const setTimeScale = useSimulationStore((state) => state.setTimeScale);
  const setPaused = useSimulationStore((state) => state.setPaused);
  const setShowOrbits = useSimulationStore((state) => state.setShowOrbits);
  const setNBodyEnabled = useSimulationStore((state) => state.setNBodyEnabled);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchPlanets(), fetchSimulationConfig()])
      .then(([planetPayload, configPayload]) => {
        if (!isMounted) {
          return;
        }

        setPlanets(planetPayload);
        setConfig(configPayload);
        setTimeScale(configPayload.timeScale);
        setPaused(configPayload.paused);
        setShowOrbits(configPayload.showOrbits);
        setNBodyEnabled(configPayload.nBodyEnabled);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setNBodyEnabled, setPaused, setShowOrbits, setTimeScale]);

  return { planets, config, isLoading };
}

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
  const setGravityScale = useSimulationStore((state) => state.setGravityScale);

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchPlanets(), fetchSimulationConfig()])
      .then(([planetPayload, configPayload]) => {
        if (!isMounted) {
          return;
        }

        const mergedConfig = { ...fallbackSimulationConfig, ...configPayload };
        setPlanets(planetPayload);
        setConfig(mergedConfig);
        setTimeScale(mergedConfig.timeScale);
        setPaused(mergedConfig.paused);
        setShowOrbits(mergedConfig.showOrbits);
        setNBodyEnabled(mergedConfig.nBodyEnabled);
        setGravityScale(mergedConfig.gravityScale);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [setGravityScale, setNBodyEnabled, setPaused, setShowOrbits, setTimeScale]);

  return { planets, config, isLoading };
}

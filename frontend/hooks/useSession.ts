"use client";

import { useEffect, useRef, useState } from "react";
import {
  addFavorite,
  createSession,
  fetchSession,
  removeFavorite,
  updateSession
} from "@/lib/api";
import { useSimulationStore } from "@/lib/store";
import type { SessionState } from "@/lib/types";

const SESSION_STORAGE_KEY = "space-sim-session-id";

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const timeScale = useSimulationStore((state) => state.timeScale);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const showOrbits = useSimulationStore((state) => state.showOrbits);
  const nBodyEnabled = useSimulationStore((state) => state.nBodyEnabled);
  const gravityScale = useSimulationStore((state) => state.gravityScale);
  const hydratedSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const bootstrap = async () => {
      setSyncState("syncing");
      try {
        const storedId = window.localStorage.getItem(SESSION_STORAGE_KEY);
        const activeSession = storedId ? await fetchSession(storedId) : await createSession();
        window.localStorage.setItem(SESSION_STORAGE_KEY, activeSession.id);
        hydratedSessionId.current = activeSession.id;
        setSession(activeSession);
        setSyncState("idle");
      } catch {
        try {
          const fallbackSession = await createSession();
          window.localStorage.setItem(SESSION_STORAGE_KEY, fallbackSession.id);
          hydratedSessionId.current = fallbackSession.id;
          setSession(fallbackSession);
          setSyncState("idle");
        } catch (createError) {
          setError(createError instanceof Error ? createError.message : "Session sync failed");
          setSyncState("error");
        }
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!session || session.id !== hydratedSessionId.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSyncState("syncing");
      void updateSession(session.id, {
        selectedPlanet,
        viewMode,
        timeScale,
        paused: isPaused,
        showOrbits,
        nBodyEnabled,
        gravityScale
      })
        .then((nextSession) => {
          setSession(nextSession);
          setSyncState("idle");
        })
        .catch((sessionError) => {
          setError(sessionError instanceof Error ? sessionError.message : "Session update failed");
          setSyncState("error");
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [gravityScale, isPaused, nBodyEnabled, selectedPlanet, session, showOrbits, timeScale, viewMode]);

  const toggleFavorite = async (planetName: string) => {
    if (!session) {
      return;
    }

    setSyncState("syncing");
    const isFavorite = session.favorites.includes(planetName);

    try {
      const result = isFavorite
        ? await removeFavorite(session.id, planetName)
        : await addFavorite(session.id, planetName);
      setSession({ ...session, favorites: result.favorites });
      setSyncState("idle");
    } catch (favoriteError) {
      setError(favoriteError instanceof Error ? favoriteError.message : "Favorite sync failed");
      setSyncState("error");
    }
  };

  return {
    session,
    favorites: session?.favorites ?? [],
    syncState,
    error,
    toggleFavorite
  };
}

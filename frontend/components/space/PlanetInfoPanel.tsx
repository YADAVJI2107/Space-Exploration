"use client";

import { useSimulationStore } from "@/lib/store";
import type { Planet } from "@/lib/types";
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Heart, Loader } from "lucide-react";
import {
  fetchEarthImagery,
  fetchMarsRovers,
  fetchPlanetNasaResources,
  type NASAResource,
  type NasaEarthImagery,
  type NasaMarsRovers
} from "@/lib/api";

interface PlanetInfoPanelProps {
  planet: Planet | null;
  favorites: string[];
  onToggleFavorite: (planetName: string) => void;
}

export function PlanetInfoPanel({ planet, favorites, onToggleFavorite }: PlanetInfoPanelProps) {
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const [nasaData, setNasaData] = useState<NASAResource | null>(null);
  const [nasaPlanetName, setNasaPlanetName] = useState<string | null>(null);
  const [liveEarthData, setLiveEarthData] = useState<NasaEarthImagery | null>(null);
  const [liveMarsData, setLiveMarsData] = useState<NasaMarsRovers | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!planet) {
      return;
    }

    const fetchNASAData = async () => {
      setLoading(true);
      try {
        const [result, earthImagery, marsRovers] = await Promise.all([
          fetchPlanetNasaResources(planet.name),
          planet.name === "Earth" ? fetchEarthImagery() : Promise.resolve(null),
          planet.name === "Mars" ? fetchMarsRovers() : Promise.resolve(null)
        ]);
        setNasaData(result.data);
        setNasaPlanetName(planet.name);
        setLiveEarthData(earthImagery?.data ?? null);
        setLiveMarsData(marsRovers?.data ?? null);
      } catch (error) {
        console.error("Failed to fetch NASA data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNASAData();
  }, [planet]);

  if (!planet || selectedPlanet !== planet.name) {
    return null;
  }

  const isFavorite = favorites.includes(planet.name);
  const visibleNasaData = nasaPlanetName === planet.name ? nasaData : null;
  const latestMarsPhoto = liveMarsData?.latest_photos?.[0];

  return (
    <div className="absolute bottom-4 left-4 max-w-sm overflow-hidden rounded-lg border border-cyan-500/30 bg-slate-950/90 shadow-lg backdrop-blur">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 to-transparent px-4 py-3 hover:bg-cyan-900/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: planet.color }} />
          <h3 className="font-bold uppercase tracking-wide text-cyan-100">{planet.name}</h3>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${isExpanded ? "" : "rotate-180"} text-cyan-400`}
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 p-4">
          <button
            type="button"
            onClick={() => onToggleFavorite(planet.name)}
            className={`inline-flex items-center gap-2 rounded px-3 py-1 text-xs font-medium transition ${
              isFavorite
                ? "bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                : "bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Heart size={13} className={isFavorite ? "fill-current" : ""} />
            {isFavorite ? "Saved to favorites" : "Save as favorite"}
          </button>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-cyan-400/70">Radius (Earth)</p>
              <p className="font-mono text-cyan-100">{planet.radius.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-cyan-400/70">Mass (kg)</p>
              <p className="font-mono text-cyan-100">{planet.mass.toExponential(1)}</p>
            </div>
            <div>
              <p className="text-cyan-400/70">Orbital Period</p>
              <p className="font-mono text-cyan-100">{planet.siderealPeriodDays.toFixed(1)}d</p>
            </div>
            <div>
              <p className="text-cyan-400/70">Orbital Velocity</p>
              <p className="font-mono text-cyan-100">{planet.orbitalVelocityKmS.toFixed(2)} km/s</p>
            </div>
            <div>
              <p className="text-cyan-400/70">Moons</p>
              <p className="font-mono text-cyan-100">{planet.moonCount}</p>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-cyan-500/20 pt-3">
            <p className="text-xs leading-relaxed text-cyan-200/80">{planet.description}</p>
            {planet.featuredMoons.length > 0 ? (
              <p className="mt-2 text-xs text-cyan-300/80">
                Featured: {planet.featuredMoons.join(", ")}
              </p>
            ) : null}
          </div>

          {/* NASA Data */}
          {visibleNasaData && (
            <div className="border-t border-cyan-500/20 pt-3">
              <p className="mb-2 text-xs font-semibold text-cyan-300">NASA Resources</p>

              {visibleNasaData.description && (
                <p className="mb-2 text-xs text-cyan-200/70">{visibleNasaData.description}</p>
              )}

              <a
                href={visibleNasaData.nasaPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-cyan-600/30 px-2 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-600/50"
              >
                Learn More <ExternalLink size={12} />
              </a>

              {visibleNasaData.threeDModels?.length ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-cyan-400">3D Models</p>
                  <ul className="space-y-1">
                    {visibleNasaData.threeDModels.map((model) => (
                      <li key={model.name}>
                        <a
                          href={model.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-200"
                        >
                          {model.name} ({model.format})
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {planet.name === "Earth" && liveEarthData?.date ? (
                <div className="mt-3 rounded border border-cyan-500/20 bg-black/20 p-2 text-xs text-cyan-100">
                  <p className="font-semibold text-cyan-300">Live NASA Earth Data</p>
                  <p className="mt-1 text-cyan-200/80">Latest imagery timestamp: {liveEarthData.date}</p>
                  {liveEarthData.url ? (
                    <a
                      href={liveEarthData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-100"
                    >
                      Open asset <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              ) : null}

              {planet.name === "Mars" && latestMarsPhoto ? (
                <div className="mt-3 rounded border border-cyan-500/20 bg-black/20 p-2 text-xs text-cyan-100">
                  <p className="font-semibold text-cyan-300">Live Mars Rover Feed</p>
                  <p className="mt-1 text-cyan-200/80">
                    {latestMarsPhoto.rover?.name ?? "Curiosity"} on {latestMarsPhoto.earth_date}
                  </p>
                  {latestMarsPhoto.img_src ? (
                    <a
                      href={latestMarsPhoto.img_src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-100"
                    >
                      View latest image <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader size={14} className="animate-spin text-cyan-400" />
              <span className="text-xs text-cyan-400">Loading NASA data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

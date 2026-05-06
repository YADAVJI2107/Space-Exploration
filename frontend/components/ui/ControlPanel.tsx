"use client";

import {
  BadgeInfo,
  Eye,
  Gauge,
  LocateFixed,
  Orbit,
  Pause,
  Play,
  Rocket,
  Settings2
} from "lucide-react";
import { updateSimulationConfig } from "@/lib/api";
import { formatNumber } from "@/lib/orbital";
import { useSimulationStore } from "@/lib/store";
import type { Planet, ViewMode } from "@/lib/types";

interface ControlPanelProps {
  planets: Planet[];
  isLoading: boolean;
}

export function ControlPanel({ planets, isLoading }: ControlPanelProps) {
  const timeScale = useSimulationStore((state) => state.timeScale);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const followTarget = useSimulationStore((state) => state.followTarget);
  const showOrbits = useSimulationStore((state) => state.showOrbits);
  const nBodyEnabled = useSimulationStore((state) => state.nBodyEnabled);
  const setTimeScale = useSimulationStore((state) => state.setTimeScale);
  const togglePaused = useSimulationStore((state) => state.togglePaused);
  const setViewMode = useSimulationStore((state) => state.setViewMode);
  const selectPlanet = useSimulationStore((state) => state.selectPlanet);
  const setFollowTarget = useSimulationStore((state) => state.setFollowTarget);
  const setShowOrbits = useSimulationStore((state) => state.setShowOrbits);
  const setNBodyEnabled = useSimulationStore((state) => state.setNBodyEnabled);

  const activePlanet = planets.find((planet) => planet.name === selectedPlanet) ?? planets[2];

  const syncUpdate = (payload: Parameters<typeof updateSimulationConfig>[0]) => {
    void updateSimulationConfig(payload);
  };

  const handleSpeedChange = (value: number) => {
    setTimeScale(value);
    syncUpdate({ timeScale: value });
  };

  const handlePaused = () => {
    const nextPaused = !isPaused;
    togglePaused();
    syncUpdate({ paused: nextPaused });
  };

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "free") {
      setFollowTarget(null);
    }
  };

  return (
    <section className="pointer-events-none absolute inset-0 z-10 flex items-start justify-between gap-4 p-4 text-slate-100 md:p-6">
      <div className="glass-panel pointer-events-auto flex max-h-[calc(100vh-2rem)] w-[min(23rem,calc(100vw-2rem))] flex-col rounded-lg p-4 md:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-normal text-white">Space Exploration</h1>
            <p className="text-xs text-slate-300">Orbital telemetry</p>
          </div>
          <div className="rounded-md border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-xs font-medium text-cyan-100">
            {isLoading ? "Syncing" : "Live"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePaused}
            className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-500/30 bg-slate-900/70 px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/50 hover:text-cyan-100"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = followTarget ? null : selectedPlanet;
              setFollowTarget(next);
            }}
            className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-500/30 bg-slate-900/70 px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/50 hover:text-cyan-100"
          >
            {followTarget ? <LocateFixed size={16} /> : <Eye size={16} />}
            {followTarget ? "Tracking" : "Follow"}
          </button>
        </div>

        <div className="mt-4 rounded-md border border-slate-600/30 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="time-scale" className="flex items-center gap-2 text-sm font-medium">
              <Gauge size={16} className="text-cyan-200" />
              Time scale
            </label>
            <span className="text-xs text-slate-300">{formatNumber(timeScale, 0)} days/s</span>
          </div>
          <input
            id="time-scale"
            className="simulation-slider mt-3 w-full"
            type="range"
            min={1}
            max={365}
            step={1}
            value={timeScale}
            onChange={(event) => handleSpeedChange(Number(event.target.value))}
          />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[5, 45, 120, 365].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className="rounded-md border border-slate-600/35 bg-slate-950/60 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-200/50"
              >
                {speed}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-slate-600/30 bg-black/20 p-1">
          <ModeButton
            active={viewMode === "system"}
            icon={<Orbit size={16} />}
            label="System"
            onClick={() => handleViewMode("system")}
          />
          <ModeButton
            active={viewMode === "free"}
            icon={<Rocket size={16} />}
            label="Free"
            onClick={() => handleViewMode("free")}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Settings2 size={16} className="text-cyan-200" />
            Planets
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(event) => {
                setShowOrbits(event.target.checked);
                syncUpdate({ showOrbits: event.target.checked });
              }}
            />
            Orbits
          </label>
        </div>

        <div className="thin-scrollbar mt-3 grid gap-2 overflow-y-auto pr-1">
          {planets.map((planet) => {
            const active = planet.name === selectedPlanet;

            return (
              <button
                key={planet.name}
                type="button"
                onClick={() => selectPlanet(planet.name)}
                className={`grid grid-cols-[1rem_1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                  active
                    ? "border-cyan-200/60 bg-cyan-200/12 text-cyan-50"
                    : "border-slate-600/25 bg-slate-950/45 text-slate-200 hover:border-cyan-200/35"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: planet.color }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{planet.name}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {formatNumber(planet.semiMajorAxisAu, 2)} AU
                  </span>
                </span>
                <span className="text-xs text-slate-300">{formatNumber(planet.orbitalVelocityKmS, 1)} km/s</span>
              </button>
            );
          })}
        </div>
      </div>

      {activePlanet ? (
        <aside className="glass-panel pointer-events-auto hidden w-80 rounded-lg p-4 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-200">Selected planet</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{activePlanet.name}</h2>
            </div>
            <BadgeInfo size={20} className="mt-1 text-cyan-200" />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">{activePlanet.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="Radius" value={`${formatNumber(activePlanet.radius, 2)} Earth`} />
            <Info label="Orbit" value={`${formatNumber(activePlanet.semiMajorAxisAu, 2)} AU`} />
            <Info label="Period" value={`${formatNumber(activePlanet.siderealPeriodDays, 0)} days`} />
            <Info label="Speed" value={`${formatNumber(activePlanet.orbitalVelocityKmS, 1)} km/s`} />
            <Info label="Eccentricity" value={formatNumber(activePlanet.eccentricity, 4)} />
            <Info label="Tilt" value={`${formatNumber(activePlanet.axialTilt, 2)} deg`} />
          </dl>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-md border border-slate-600/30 bg-black/20 px-3 py-2 text-sm text-slate-200">
            <span>Simplified N-body API</span>
            <input
              type="checkbox"
              checked={nBodyEnabled}
              onChange={(event) => {
                setNBodyEnabled(event.target.checked);
                syncUpdate({ nBodyEnabled: event.target.checked });
              }}
            />
          </label>
        </aside>
      ) : null}
    </section>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-9 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition ${
        active ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-600/25 bg-slate-950/45 p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

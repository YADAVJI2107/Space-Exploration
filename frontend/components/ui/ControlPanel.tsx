"use client";

import {
  Eye,
  Gauge,
  LocateFixed,
  Map,
  Orbit,
  Pause,
  Play,
  Rocket,
  Settings2,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { updateSimulationConfig } from "@/lib/api";
import type { ApiDataSource } from "@/lib/api";
import {
  explorationDestinationMap,
  explorationDestinations,
  galaxyDestinations,
  systemDestinations
} from "@/lib/exploration-data";
import { formatNumber } from "@/lib/orbital";
import { useSimulationStore } from "@/lib/store";
import type { Planet, ViewMode } from "@/lib/types";

interface ControlPanelProps {
  planets: Planet[];
  isLoading: boolean;
  dataSource?: ApiDataSource;
  dataError?: string | null;
}

type PanelTabId = "map" | "planets" | "settings";

export function ControlPanel({
  planets,
  isLoading,
  dataSource = "api",
  dataError = null
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTabId>("map");
  const timeScale = useSimulationStore((state) => state.timeScale);
  const isPaused = useSimulationStore((state) => state.isPaused);
  const viewMode = useSimulationStore((state) => state.viewMode);
  const selectedPlanet = useSimulationStore((state) => state.selectedPlanet);
  const selectedDestination = useSimulationStore((state) => state.selectedDestination);
  const followTarget = useSimulationStore((state) => state.followTarget);
  const showOrbits = useSimulationStore((state) => state.showOrbits);
  const nBodyEnabled = useSimulationStore((state) => state.nBodyEnabled);
  const gravityScale = useSimulationStore((state) => state.gravityScale);
  const showGalaxy = useSimulationStore((state) => state.showGalaxy);
  const showNebula = useSimulationStore((state) => state.showNebula);
  const showDust = useSimulationStore((state) => state.showDust);
  const setTimeScale = useSimulationStore((state) => state.setTimeScale);
  const togglePaused = useSimulationStore((state) => state.togglePaused);
  const setViewMode = useSimulationStore((state) => state.setViewMode);
  const selectPlanet = useSimulationStore((state) => state.selectPlanet);
  const setFollowTarget = useSimulationStore((state) => state.setFollowTarget);
  const setSelectedDestination = useSimulationStore((state) => state.setSelectedDestination);
  const setShowOrbits = useSimulationStore((state) => state.setShowOrbits);
  const setNBodyEnabled = useSimulationStore((state) => state.setNBodyEnabled);
  const setGravityScale = useSimulationStore((state) => state.setGravityScale);
  const setShowGalaxy = useSimulationStore((state) => state.setShowGalaxy);
  const setShowNebula = useSimulationStore((state) => state.setShowNebula);
  const setShowDust = useSimulationStore((state) => state.setShowDust);

  const activePlanet = planets.find((planet) => planet.name === selectedPlanet) ?? planets[2];
  const activeDestination =
    explorationDestinations.find((destination) => destination.id === selectedDestination) ??
    explorationDestinations[0];
  const selectedGalaxyId =
    activeDestination.kind === "galaxy"
      ? activeDestination.id
      : activeDestination.kind === "overview"
        ? "milky-way"
        : activeDestination.parentId ?? "milky-way";
  const visibleSystems = systemDestinations.filter(
    (destination) => destination.parentId === selectedGalaxyId
  );

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
    <section className="pointer-events-none absolute inset-0 z-10 p-3 text-slate-100 md:p-5">
      <div className="glass-panel pointer-events-auto flex max-h-[calc(100vh-1.5rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg md:max-h-[calc(100vh-2.5rem)]">
        <div className="border-b border-white/10 p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-white">Space Exploration</h1>
              <p className="text-xs text-slate-300">Orbital telemetry</p>
            </div>
            <div
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${
                dataSource === "fallback" && !isLoading
                  ? "border-amber-200/35 bg-amber-300/10 text-amber-100"
                  : "border-cyan-200/30 bg-cyan-200/10 text-cyan-100"
              }`}
              title={dataError ?? undefined}
            >
              {isLoading ? "Syncing" : dataSource === "fallback" ? "Fallback" : "Live"}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
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
                const next =
                  selectedDestination !== "solar-system"
                    ? null
                    : followTarget
                      ? null
                      : selectedPlanet;
                setFollowTarget(next);
              }}
              className="flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-500/30 bg-slate-900/70 px-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/50 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={selectedDestination !== "solar-system"}
            >
              {followTarget ? <LocateFixed size={16} /> : <Eye size={16} />}
              {selectedDestination !== "solar-system"
                ? "Deep Space"
                : followTarget
                  ? "Tracking"
                  : "Follow"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-slate-600/30 bg-black/20 p-1">
            <PanelTab
              active={activeTab === "map"}
              icon={<Map size={15} />}
              label="Map"
              onClick={() => setActiveTab("map")}
            />
            <PanelTab
              active={activeTab === "planets"}
              icon={<Orbit size={15} />}
              label="Planets"
              onClick={() => setActiveTab("planets")}
            />
            <PanelTab
              active={activeTab === "settings"}
              icon={<SlidersHorizontal size={15} />}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          </div>
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto p-4 pt-3">
          {activeTab === "map" ? (
            <MapTab
              activeDestinationKind={activeDestination.kind}
              activeDescription={activeDestination.description}
              selectedDestination={selectedDestination}
              selectedGalaxyId={selectedGalaxyId}
              visibleSystems={visibleSystems}
              onSelectDestination={setSelectedDestination}
            />
          ) : null}

          {activeTab === "planets" ? (
            <PlanetsTab
              activePlanet={activePlanet}
              planets={planets}
              selectedPlanet={selectedPlanet}
              selectedDestination={selectedDestination}
              showOrbits={showOrbits}
              onSelectPlanet={selectPlanet}
              onSetShowOrbits={(show) => {
                setShowOrbits(show);
                syncUpdate({ showOrbits: show });
              }}
              onSetViewMode={setViewMode}
            />
          ) : null}

          {activeTab === "settings" ? (
            <SettingsTab
              gravityScale={gravityScale}
              nBodyEnabled={nBodyEnabled}
              showDust={showDust}
              showGalaxy={showGalaxy}
              showNebula={showNebula}
              timeScale={timeScale}
              viewMode={viewMode}
              onSetGravityScale={(value) => {
                setGravityScale(value);
                syncUpdate({ gravityScale: value });
              }}
              onSetNBodyEnabled={(enabled) => {
                setNBodyEnabled(enabled);
                syncUpdate({ nBodyEnabled: enabled });
              }}
              onSetShowDust={setShowDust}
              onSetShowGalaxy={setShowGalaxy}
              onSetShowNebula={setShowNebula}
              onSetTimeScale={handleSpeedChange}
              onSetViewMode={handleViewMode}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface MapTabProps {
  activeDestinationKind: string;
  activeDescription: string;
  selectedDestination: string;
  selectedGalaxyId: string;
  visibleSystems: typeof systemDestinations;
  onSelectDestination: (destination: string) => void;
}

function MapTab({
  activeDestinationKind,
  activeDescription,
  selectedDestination,
  selectedGalaxyId,
  visibleSystems,
  onSelectDestination
}: MapTabProps) {
  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <Rocket size={16} className="text-cyan-200" />
            Galaxy map
          </h3>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {activeDestinationKind.replace("-", " ")}
          </span>
        </div>
        <p className="thin-scrollbar mt-2 max-h-28 overflow-y-auto pr-1 text-xs leading-5 text-slate-300">
          {activeDescription}
        </p>
        <div className="mt-3 grid gap-2">
          <DestinationButton
            active={selectedDestination === "local-group"}
            label="Local Group"
            meta="Overview"
            onClick={() => onSelectDestination("local-group")}
          />
          {galaxyDestinations.map((destination) => (
            <DestinationButton
              key={destination.id}
              active={destination.id === selectedDestination}
              label={destination.name}
              meta="Galaxy"
              onClick={() => onSelectDestination(destination.id)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Systems In {explorationDestinationMap[selectedGalaxyId]?.name ?? "Milky Way"}
          </h4>
          <span className="text-[11px] text-slate-500">{visibleSystems.length} nodes</span>
        </div>
        <div className="mt-2 grid gap-2">
          {visibleSystems.map((destination) => (
            <DestinationButton
              key={destination.id}
              active={destination.id === selectedDestination}
              label={destination.name}
              meta={destination.kind === "solar-system" ? "Planets" : "System"}
              onClick={() => onSelectDestination(destination.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

interface PlanetsTabProps {
  activePlanet: Planet;
  planets: Planet[];
  selectedPlanet: string;
  selectedDestination: string;
  showOrbits: boolean;
  onSelectPlanet: (planet: string) => void;
  onSetShowOrbits: (show: boolean) => void;
  onSetViewMode: (mode: ViewMode) => void;
}

function PlanetsTab({
  activePlanet,
  planets,
  selectedPlanet,
  selectedDestination,
  showOrbits,
  onSelectPlanet,
  onSetShowOrbits,
  onSetViewMode
}: PlanetsTabProps) {
  const canInspectPlanets = selectedDestination === "solar-system";

  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Settings2 size={16} className="text-cyan-200" />
            Planets
          </h2>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showOrbits}
              onChange={(event) => onSetShowOrbits(event.target.checked)}
            />
            Orbits
          </label>
        </div>

        {!canInspectPlanets ? (
          <p className="mt-2 text-xs text-slate-400">
            Select Solar System from the map to inspect planets.
          </p>
        ) : null}

        <div className="mt-3 grid gap-2">
          {planets.map((planet) => {
            const active = planet.name === selectedPlanet;

            return (
              <button
                key={planet.name}
                type="button"
                onClick={() => onSelectPlanet(planet.name)}
                disabled={!canInspectPlanets}
                className={`grid grid-cols-[1rem_1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed ${
                  active
                    ? "border-cyan-200/60 bg-cyan-200/12 text-cyan-50"
                    : "border-slate-600/25 bg-slate-950/45 text-slate-200 hover:border-cyan-200/35"
                } ${canInspectPlanets ? "" : "opacity-55"}`}
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
                <span className="text-xs text-slate-300">
                  {formatNumber(planet.orbitalVelocityKmS, 1)} km/s
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-white">{activePlanet.name}</h3>
          <button
            type="button"
            onClick={() => onSetViewMode("planet")}
            className="rounded-md border border-cyan-200/30 bg-cyan-200/10 px-2 py-1 text-xs font-medium text-cyan-100 transition hover:border-cyan-100/60"
          >
            Inspect
          </button>
        </div>
        <p className="thin-scrollbar mt-2 max-h-32 overflow-y-auto pr-1 text-xs leading-5 text-slate-300">
          {activePlanet.description}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Info label="Orbit" value={`${formatNumber(activePlanet.semiMajorAxisAu, 2)} AU`} />
          <Info label="Speed" value={`${formatNumber(activePlanet.orbitalVelocityKmS, 1)} km/s`} />
          <Info label="Moons" value={formatNumber(activePlanet.moonCount, 0)} />
          <Info label="Tilt" value={`${formatNumber(activePlanet.axialTilt, 1)} deg`} />
        </dl>
      </section>
    </div>
  );
}

interface SettingsTabProps {
  gravityScale: number;
  nBodyEnabled: boolean;
  showDust: boolean;
  showGalaxy: boolean;
  showNebula: boolean;
  timeScale: number;
  viewMode: ViewMode;
  onSetGravityScale: (value: number) => void;
  onSetNBodyEnabled: (enabled: boolean) => void;
  onSetShowDust: (show: boolean) => void;
  onSetShowGalaxy: (show: boolean) => void;
  onSetShowNebula: (show: boolean) => void;
  onSetTimeScale: (value: number) => void;
  onSetViewMode: (mode: ViewMode) => void;
}

function SettingsTab({
  gravityScale,
  nBodyEnabled,
  showDust,
  showGalaxy,
  showNebula,
  timeScale,
  viewMode,
  onSetGravityScale,
  onSetNBodyEnabled,
  onSetShowDust,
  onSetShowGalaxy,
  onSetShowNebula,
  onSetTimeScale,
  onSetViewMode
}: SettingsTabProps) {
  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
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
          min={0.5}
          max={120}
          step={1}
          value={timeScale}
          onChange={(event) => onSetTimeScale(Number(event.target.value))}
        />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[1, 8, 24, 90].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSetTimeScale(speed)}
              className="rounded-md border border-slate-600/35 bg-slate-950/60 px-2 py-1 text-xs text-slate-200 transition hover:border-cyan-200/50"
            >
              {speed}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <div className="grid grid-cols-3 gap-2 rounded-md border border-slate-600/30 bg-black/20 p-1">
          <ModeButton
            active={viewMode === "system"}
            icon={<Orbit size={16} />}
            label="System"
            onClick={() => onSetViewMode("system")}
          />
          <ModeButton
            active={viewMode === "free"}
            icon={<Rocket size={16} />}
            label="Free"
            onClick={() => onSetViewMode("free")}
          />
          <ModeButton
            active={viewMode === "planet"}
            icon={<Eye size={16} />}
            label="Planet"
            onClick={() => onSetViewMode("planet")}
          />
        </div>
      </section>

      <section className="rounded-md border border-slate-600/30 bg-black/20 p-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={16} className="text-cyan-200" />
          Layers
        </h3>
        <div className="mt-3 grid gap-2 text-xs text-slate-300">
          <OptionToggle
            label="Galaxy backdrop"
            checked={showGalaxy}
            onChange={onSetShowGalaxy}
          />
          <OptionToggle
            label="Nebula bloom"
            checked={showNebula}
            onChange={onSetShowNebula}
          />
          <OptionToggle
            label="Cosmic dust"
            checked={showDust}
            onChange={onSetShowDust}
          />
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-slate-600/30 bg-black/20 px-3 py-2 text-sm text-slate-200">
        <label className="flex items-center justify-between gap-3">
          <span>Simplified N-body</span>
          <input
            type="checkbox"
            checked={nBodyEnabled}
            onChange={(event) => onSetNBodyEnabled(event.target.checked)}
          />
        </label>
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Gravity scale</span>
            <span>{formatNumber(gravityScale, 2)}x</span>
          </div>
          <input
            className="simulation-slider mt-2 w-full"
            type="range"
            aria-label="Gravity scale"
            min={0.6}
            max={1.6}
            step={0.05}
            value={gravityScale}
            onChange={(event) => onSetGravityScale(Number(event.target.value))}
          />
        </div>
      </section>
    </div>
  );
}

function DestinationButton({
  active,
  label,
  meta,
  onClick
}: {
  active: boolean;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-left transition ${
        active
          ? "border-cyan-200/60 bg-cyan-200/12 text-cyan-50"
          : "border-slate-600/25 bg-slate-950/45 text-slate-200 hover:border-cyan-200/35"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium">{label}</span>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          {meta}
        </span>
      </span>
    </button>
  );
}

function PanelTab({
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
      className={`flex min-h-9 items-center justify-center gap-1 rounded px-2 text-xs font-medium transition ${
        active ? "bg-cyan-200 text-slate-950" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
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

function OptionToggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-600/25 bg-slate-950/40 px-3 py-2">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

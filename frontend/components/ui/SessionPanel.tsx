"use client";

import { Database, Heart, Orbit, Radio } from "lucide-react";
import type { SessionState } from "@/lib/types";

interface SessionPanelProps {
  session: SessionState | null;
  syncState: "idle" | "syncing" | "error";
  error: string | null;
}

export function SessionPanel({ session, syncState, error }: SessionPanelProps) {
  return (
    <aside className="glass-panel pointer-events-auto absolute right-4 top-4 z-10 hidden w-72 rounded-lg p-4 text-slate-100 lg:block md:right-6 md:top-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-200">Persistent session</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {session?.name ?? "Provisioning"}
          </h2>
        </div>
        <Database size={18} className="mt-1 text-cyan-200" />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Heart size={14} className="text-cyan-200" />
            Favorites
          </span>
          <span>{session?.favorites?.length ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Orbit size={14} className="text-cyan-200" />
            Selected
          </span>
          <span>{session?.selectedPlanet ?? "Earth"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <Radio size={14} className="text-cyan-200" />
            Sync
          </span>
          <span>{syncState === "idle" ? "Live" : syncState === "syncing" ? "Syncing" : "Retry"}</span>
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-amber-200">{error}</p> : null}
    </aside>
  );
}

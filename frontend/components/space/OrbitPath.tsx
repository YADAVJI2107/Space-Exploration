"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { orbitalPathPoints } from "@/lib/orbital";
import type { Planet } from "@/lib/types";

interface OrbitPathProps {
  planet: Planet;
}

export function OrbitPath({ planet }: OrbitPathProps) {
  const points = useMemo(() => orbitalPathPoints(planet), [planet]);

  return (
    <Line
      points={points}
      color={planet.color}
      transparent
      opacity={planet.name === "Mercury" ? 0.35 : 0.24}
      lineWidth={1}
      dashed={false}
    />
  );
}

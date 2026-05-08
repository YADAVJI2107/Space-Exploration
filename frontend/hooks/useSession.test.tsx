import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import SpaceSimulation from "@/components/space/SpaceSimulation";

const { mockSession } = vi.hoisted(() => ({
  mockSession: {
    id: "session-1",
    name: "Explorer Session",
    selectedPlanet: "Earth",
    viewMode: "system" as const,
    timeScale: 45,
    paused: false,
    backendDriven: false,
    nBodyEnabled: false,
    gravityScale: 1,
    showOrbits: true,
    favorites: ["Earth"],
    createdAt: "2026-05-08T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z"
  }
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/space/SolarSystemScene", () => ({
  SolarSystemScene: () => <div>Scene</div>
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    fetchPlanets: vi.fn().mockResolvedValue({
      data: [],
      source: "api"
    }),
    fetchSimulationConfig: vi.fn().mockResolvedValue({
      data: {
        timeScale: 45,
        gravitationalConstant: 6.6743e-11,
        galacticSpeed: 0.16,
        gravityScale: 1,
        backendDriven: false,
        nBodyEnabled: false,
        showOrbits: true,
        paused: false
      },
      source: "api"
    }),
    createSession: vi.fn().mockResolvedValue(mockSession),
    fetchSession: vi.fn().mockRejectedValue(new Error("missing session")),
    updateSession: vi.fn().mockResolvedValue(mockSession),
    fetchPlanetNasaResources: vi.fn().mockResolvedValue({
      data: {
        nasaPage: "https://science.nasa.gov/earth/",
        threeDModels: [],
        description: "Earth"
      },
      source: "api"
    })
  };
});

describe("useSession integration", () => {
  it("renders session status after bootstrapping", async () => {
    render(<SpaceSimulation />);

    await waitFor(() => {
      expect(screen.getByText(/persistent session/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/explorer session/i)).toBeInTheDocument();
    expect(screen.getByText(/favorites/i).parentElement).toHaveTextContent("1");
  });
});

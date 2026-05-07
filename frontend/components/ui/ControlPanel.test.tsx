import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ControlPanel } from "@/components/ui/ControlPanel";
import { fallbackPlanets } from "@/lib/planet-data";
import { useSimulationStore } from "@/lib/store";

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    timeScale: 45,
    gravitationalConstant: 6.6743e-11,
    galacticSpeed: 0.16,
    gravityScale: 1,
    backendDriven: false,
    nBodyEnabled: false,
    showOrbits: true,
    paused: false
  }
}));

vi.mock("@/lib/api", () => ({
  updateSimulationConfig: vi.fn().mockResolvedValue({ config: mockConfig })
}));

describe("ControlPanel", () => {
  const initialState = useSimulationStore.getState();

  beforeEach(() => {
    useSimulationStore.setState(initialState, true);
  });

  it("toggles simulation controls", () => {
    render(<ControlPanel planets={fallbackPlanets} isLoading={false} />);

    const pauseButton = screen.getByRole("button", { name: /pause/i });
    fireEvent.click(pauseButton);
    expect(useSimulationStore.getState().isPaused).toBe(true);

    const galaxyToggle = screen.getByLabelText(/galaxy backdrop/i);
    fireEvent.click(galaxyToggle);
    expect(useSimulationStore.getState().showGalaxy).toBe(false);

    const gravitySlider = screen.getByRole("slider", { name: /gravity scale/i });
    fireEvent.change(gravitySlider, { target: { value: "1.2" } });
    expect(useSimulationStore.getState().gravityScale).toBeCloseTo(1.2, 2);
  });
});

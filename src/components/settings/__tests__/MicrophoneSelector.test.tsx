import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MicrophoneSelector } from "../MicrophoneSelector";
import { useSettings } from "@/hooks/useSettings";
import type { AudioDevice } from "@/bindings";

vi.mock("@/hooks/useSettings");

const mockUseSettings = vi.mocked(useSettings);

const DEFAULT_DEVICE: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};
const BUILTIN_MIC: AudioDevice = {
  index: "1",
  name: "Built-in Microphone",
  is_default: false,
};

function makeSettings(
  overrides: Partial<ReturnType<typeof useSettings>> = {},
): ReturnType<typeof useSettings> {
  return {
    getSetting: vi.fn((key: string) =>
      key === "selected_microphone" ? "default" : undefined,
    ),
    updateSetting: vi.fn().mockResolvedValue(undefined),
    resetSetting: vi.fn().mockResolvedValue(undefined),
    isUpdating: vi.fn().mockReturnValue(false),
    isLoading: false,
    audioDevices: [DEFAULT_DEVICE, BUILTIN_MIC],
    refreshAudioDevices: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useSettings>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MicrophoneSelector", () => {
  it("renders the microphone title", () => {
    mockUseSettings.mockReturnValue(makeSettings());
    render(<MicrophoneSelector />);
    expect(
      screen.getByText("settings.sound.microphone.title"),
    ).toBeInTheDocument();
  });

  it("shows available devices when dropdown is opened", async () => {
    mockUseSettings.mockReturnValue(makeSettings());
    render(<MicrophoneSelector />);
    // The dropdown trigger button contains the selected value as its accessible name.
    // SettingContainer also renders an SVG with role="button", so we can't use [0].
    await userEvent.click(screen.getByRole("button", { name: "Default" }));
    // Built-in Microphone only appears inside the open dropdown list
    expect(screen.getByText("Built-in Microphone")).toBeInTheDocument();
  });

  it("calls updateSetting when a device is selected", async () => {
    const settings = makeSettings();
    mockUseSettings.mockReturnValue(settings);
    render(<MicrophoneSelector />);
    // Open the dropdown by clicking the trigger, then select a device
    await userEvent.click(screen.getByRole("button", { name: "Default" }));
    await userEvent.click(screen.getByText("Built-in Microphone"));
    expect(settings.updateSetting).toHaveBeenCalledWith(
      "selected_microphone",
      "Built-in Microphone",
    );
  });

  it("shows loading placeholder when isLoading is true", () => {
    // Empty device list means the selected value has no matching option,
    // so the Dropdown falls back to the placeholder text.
    mockUseSettings.mockReturnValue(
      makeSettings({ isLoading: true, audioDevices: [] }),
    );
    render(<MicrophoneSelector />);
    expect(
      screen.getByText("settings.sound.microphone.loading"),
    ).toBeInTheDocument();
  });

  it("calls resetSetting when the reset button is clicked", () => {
    const settings = makeSettings();
    mockUseSettings.mockReturnValue(settings);
    render(<MicrophoneSelector />);
    // The reset button is always last — after the Dropdown trigger.
    const buttons = screen.getAllByRole("button");
    const resetBtn = buttons[buttons.length - 1];
    // Use fireEvent rather than userEvent so pointer-event CSS doesn't block the click.
    fireEvent.click(resetBtn);
    expect(settings.resetSetting).toHaveBeenCalledWith("selected_microphone");
  });
});

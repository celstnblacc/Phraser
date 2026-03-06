import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioFeedback } from "../AudioFeedback";
import { useSettings } from "@/hooks/useSettings";

vi.mock("@/hooks/useSettings");

const mockUseSettings = vi.mocked(useSettings);

function makeSettings(audioFeedback: boolean, isUpdating = false) {
  return {
    getSetting: vi.fn((key: string) =>
      key === "audio_feedback" ? audioFeedback : undefined,
    ),
    updateSetting: vi.fn().mockResolvedValue(undefined),
    isUpdating: vi.fn().mockReturnValue(isUpdating),
  } as unknown as ReturnType<typeof useSettings>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AudioFeedback", () => {
  it("renders the audio feedback label", () => {
    mockUseSettings.mockReturnValue(makeSettings(false));
    render(<AudioFeedback />);
    expect(
      screen.getByText("settings.sound.audioFeedback.label"),
    ).toBeInTheDocument();
  });

  it("toggle is unchecked when audio_feedback is false", () => {
    mockUseSettings.mockReturnValue(makeSettings(false));
    render(<AudioFeedback />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggle is checked when audio_feedback is true", () => {
    mockUseSettings.mockReturnValue(makeSettings(true));
    render(<AudioFeedback />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls updateSetting('audio_feedback', true) when toggled on", async () => {
    const settings = makeSettings(false);
    mockUseSettings.mockReturnValue(settings);
    render(<AudioFeedback />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(settings.updateSetting).toHaveBeenCalledWith("audio_feedback", true);
  });

  it("calls updateSetting('audio_feedback', false) when toggled off", async () => {
    const settings = makeSettings(true);
    mockUseSettings.mockReturnValue(settings);
    render(<AudioFeedback />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(settings.updateSetting).toHaveBeenCalledWith(
      "audio_feedback",
      false,
    );
  });

  it("toggle is disabled while isUpdating", () => {
    mockUseSettings.mockReturnValue(makeSettings(false, true));
    render(<AudioFeedback />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});

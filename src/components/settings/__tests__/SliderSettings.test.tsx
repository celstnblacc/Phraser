import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";

import { VolumeSlider } from "../VolumeSlider";
import { PasteDelay } from "../debug/PasteDelay";
import { WordCorrectionThreshold } from "../debug/WordCorrectionThreshold";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── VolumeSlider ─────────────────────────────────────────────────────────────

describe("VolumeSlider", () => {
  it("renders the volume title", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ audio_feedback_volume: 0.5 }),
    );
    render(<VolumeSlider />);
    expect(screen.getByText("settings.sound.volume.title")).toBeInTheDocument();
  });

  it("shows the current volume as a percentage", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ audio_feedback_volume: 0.7 }),
    );
    render(<VolumeSlider />);
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("calls updateSetting when the slider changes", () => {
    const settings = makeSettings({ audio_feedback_volume: 0.5 });
    mockUseSettings.mockReturnValue(settings);
    render(<VolumeSlider />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.8" } });
    expect(settings.updateSetting).toHaveBeenCalledWith(
      "audio_feedback_volume",
      0.8,
    );
  });

  it("slider is disabled when disabled prop is true", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ audio_feedback_volume: 0.5 }),
    );
    render(<VolumeSlider disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
  });
});

// ─── PasteDelay ───────────────────────────────────────────────────────────────

describe("PasteDelay", () => {
  it("renders the paste delay title", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({}, { settings: { paste_delay_ms: 60 } as any }),
    );
    render(<PasteDelay />);
    expect(
      screen.getByText("settings.debug.pasteDelay.title"),
    ).toBeInTheDocument();
  });

  it("calls updateSetting when slider changes", () => {
    const settings = makeSettings(
      {},
      { settings: { paste_delay_ms: 60 } as any },
    );
    mockUseSettings.mockReturnValue(settings);
    render(<PasteDelay />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "100" } });
    expect(settings.updateSetting).toHaveBeenCalledWith("paste_delay_ms", 100);
  });
});

// ─── WordCorrectionThreshold ─────────────────────────────────────────────────

describe("WordCorrectionThreshold", () => {
  it("renders the threshold title", () => {
    mockUseSettings.mockReturnValue(
      makeSettings(
        {},
        { settings: { word_correction_threshold: 0.18 } as any },
      ),
    );
    render(<WordCorrectionThreshold />);
    expect(
      screen.getByText("settings.debug.wordCorrectionThreshold.title"),
    ).toBeInTheDocument();
  });

  it("calls updateSetting when slider changes", () => {
    const settings = makeSettings(
      {},
      { settings: { word_correction_threshold: 0.18 } as any },
    );
    mockUseSettings.mockReturnValue(settings);
    render(<WordCorrectionThreshold />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.3" } });
    expect(settings.updateSetting).toHaveBeenCalledWith(
      "word_correction_threshold",
      0.3,
    );
  });
});

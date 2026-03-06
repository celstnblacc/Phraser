/**
 * Factory-pattern tests for all simple toggle settings.
 * Each component wraps a ToggleSwitch and follows the same contract:
 *   getSetting(key) → current value
 *   updateSetting(key, !value) on change
 *   isUpdating(key) → disabled state
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";
import type { AppSettings } from "@/bindings";

import { MuteWhileRecording } from "../MuteWhileRecording";
import { PushToTalk } from "../PushToTalk";
import { TranslateToEnglish } from "../TranslateToEnglish";
import { ShowTrayIcon } from "../ShowTrayIcon";
import { AppendTrailingSpace } from "../AppendTrailingSpace";
import { StartHidden } from "../StartHidden";
import { AutostartToggle } from "../AutostartToggle";
import { PostProcessingToggle } from "../PostProcessingToggle";
import { ExperimentalToggle } from "../ExperimentalToggle";
import { UpdateChecksToggle } from "../UpdateChecksToggle";
import { AlwaysOnMicrophone } from "../AlwaysOnMicrophone";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

beforeEach(() => {
  vi.clearAllMocks();
});

function testToggle(
  Component: React.ComponentType<{
    descriptionMode?: "inline" | "tooltip";
    grouped?: boolean;
  }>,
  settingKey: keyof AppSettings,
  labelKey: string,
) {
  describe(`${String(settingKey)}`, () => {
    it("renders the setting label", () => {
      mockUseSettings.mockReturnValue(
        makeSettings({ [settingKey]: false } as Partial<AppSettings>),
      );
      render(<Component />);
      expect(screen.getByText(labelKey)).toBeInTheDocument();
    });

    it("checkbox is unchecked when setting is false", () => {
      mockUseSettings.mockReturnValue(
        makeSettings({ [settingKey]: false } as Partial<AppSettings>),
      );
      render(<Component />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("checkbox is checked when setting is true", () => {
      mockUseSettings.mockReturnValue(
        makeSettings({ [settingKey]: true } as Partial<AppSettings>),
      );
      render(<Component />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it(`calls updateSetting('${String(settingKey)}', true) when toggled on`, async () => {
      const settings = makeSettings({
        [settingKey]: false,
      } as Partial<AppSettings>);
      mockUseSettings.mockReturnValue(settings);
      render(<Component />);
      await userEvent.click(screen.getByRole("checkbox"));
      expect(settings.updateSetting).toHaveBeenCalledWith(settingKey, true);
    });

    it("checkbox is disabled while isUpdating", () => {
      mockUseSettings.mockReturnValue(
        makeSettings({ [settingKey]: false } as Partial<AppSettings>, {
          isUpdating: vi.fn().mockReturnValue(true),
        }),
      );
      render(<Component />);
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });
  });
}

testToggle(
  MuteWhileRecording,
  "mute_while_recording",
  "settings.debug.muteWhileRecording.label",
);
testToggle(PushToTalk, "push_to_talk", "settings.general.pushToTalk.label");
testToggle(
  TranslateToEnglish,
  "translate_to_english",
  "settings.advanced.translateToEnglish.label",
);
testToggle(
  ShowTrayIcon,
  "show_tray_icon",
  "settings.advanced.showTrayIcon.label",
);
testToggle(
  AppendTrailingSpace,
  "append_trailing_space",
  "settings.debug.appendTrailingSpace.label",
);
testToggle(StartHidden, "start_hidden", "settings.advanced.startHidden.label");
testToggle(
  AutostartToggle,
  "autostart_enabled",
  "settings.advanced.autostart.label",
);
testToggle(
  PostProcessingToggle,
  "post_process_enabled",
  "settings.debug.postProcessingToggle.label",
);
testToggle(
  ExperimentalToggle,
  "experimental_enabled",
  "settings.advanced.experimentalToggle.label",
);
testToggle(
  UpdateChecksToggle,
  "update_checks_enabled",
  "settings.debug.updateChecks.label",
);
testToggle(
  AlwaysOnMicrophone,
  "always_on_microphone",
  "settings.debug.alwaysOnMicrophone.label",
);

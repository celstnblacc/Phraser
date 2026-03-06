import { vi } from "vitest";
import type { useSettings } from "@/hooks/useSettings";
import type { AppSettings, AudioDevice, PostProcessAction } from "@/bindings";

type UseSettingsReturn = ReturnType<typeof useSettings>;

export const DEFAULT_ACTIONS: PostProcessAction[] = [
  { key: 1, name: "Summarize", prompt: "Summarize the following text:" },
  {
    key: 2,
    name: "Fix Grammar",
    prompt: "Fix the grammar of the following text:",
  },
];

export const DEFAULT_MIC: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};
export const BUILTIN_MIC: AudioDevice = {
  index: "1",
  name: "Built-in Microphone",
  is_default: false,
};
export const DEFAULT_OUTPUT: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};

/**
 * Creates a fully-typed useSettings mock.
 *
 * @param values  - Subset of AppSettings used to seed getSetting() and the
 *                  `settings` object. Controls what each setting's "current value" is.
 * @param overrides - Override any specific return properties (e.g. isLoading, audioDevices).
 */
export function makeSettings(
  values: Partial<AppSettings> = {},
  overrides: Partial<UseSettingsReturn> = {},
): UseSettingsReturn {
  return {
    settings: values as AppSettings,
    isLoading: false,
    isUpdating: vi.fn().mockReturnValue(false),
    audioDevices: [DEFAULT_MIC, BUILTIN_MIC],
    outputDevices: [DEFAULT_OUTPUT],
    audioFeedbackEnabled: values.audio_feedback ?? false,
    postProcessModelOptions: {},
    getSetting: vi
      .fn()
      .mockImplementation(
        <K extends keyof AppSettings>(key: K) =>
          values[key] as AppSettings[K] | undefined,
      ),
    updateSetting: vi.fn().mockResolvedValue(undefined),
    resetSetting: vi.fn().mockResolvedValue(undefined),
    refreshSettings: vi.fn().mockResolvedValue(undefined),
    refreshAudioDevices: vi.fn().mockResolvedValue(undefined),
    refreshOutputDevices: vi.fn().mockResolvedValue(undefined),
    updateBinding: vi.fn().mockResolvedValue(undefined),
    resetBinding: vi.fn().mockResolvedValue(undefined),
    setPostProcessProvider: vi.fn().mockResolvedValue(undefined),
    updatePostProcessBaseUrl: vi.fn().mockResolvedValue(undefined),
    updatePostProcessApiKey: vi.fn().mockResolvedValue(undefined),
    updatePostProcessModel: vi.fn().mockResolvedValue(undefined),
    fetchPostProcessModels: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

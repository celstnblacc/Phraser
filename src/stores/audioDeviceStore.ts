import { create } from "zustand";
import type { AudioDevice } from "@/bindings";
import { commands } from "@/bindings";

// Sentinel entry representing the system-default device for both
// input (microphone) and output (speaker) device selectors.
export const DEFAULT_DEVICE_ENTRY: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};

// Case-insensitive guard: the backend may return a "Default" device entry;
// we replace it with our own sentinel to ensure consistent identity.
const DEFAULT_DEVICE_NAME_LOWER = "default";

async function fetchDeviceList(
  fetcher: () => Promise<
    { status: string; data: AudioDevice[] } | { status: "error"; error: string }
  >,
): Promise<AudioDevice[]> {
  try {
    const result = await fetcher();
    if (result.status === "ok") {
      return [
        DEFAULT_DEVICE_ENTRY,
        ...(result as { status: "ok"; data: AudioDevice[] }).data.filter(
          (d) => d.name.toLowerCase() !== DEFAULT_DEVICE_NAME_LOWER,
        ),
      ];
    }
    return [DEFAULT_DEVICE_ENTRY];
  } catch (error) {
    console.error("Failed to load audio devices:", error);
    return [DEFAULT_DEVICE_ENTRY];
  }
}

interface AudioDeviceStore {
  audioDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  refreshAudioDevices: () => Promise<void>;
  refreshOutputDevices: () => Promise<void>;
}

export const useAudioDeviceStore = create<AudioDeviceStore>()((set) => ({
  audioDevices: [],
  outputDevices: [],

  refreshAudioDevices: async () => {
    const devices = await fetchDeviceList(commands.getAvailableMicrophones);
    set({ audioDevices: devices });
  },

  refreshOutputDevices: async () => {
    const devices = await fetchDeviceList(commands.getAvailableOutputDevices);
    set({ outputDevices: devices });
  },
}));

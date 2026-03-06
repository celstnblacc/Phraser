import { create } from "zustand";
import type { AudioDevice, Result } from "@/bindings";
import { commands } from "@/bindings";

// Sentinel entry representing the system-default device for both
// input (microphone) and output (speaker) device selectors.
export const DEFAULT_DEVICE_ENTRY: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};

// The backend may return its own "Default" device; we filter it and use our sentinel instead.
const BACKEND_DEFAULT_DEVICE_NAME = "default";

async function fetchDeviceList(
  fetcher: () => Promise<Result<AudioDevice[], string>>,
): Promise<AudioDevice[]> {
  try {
    const result = await fetcher();
    if (result.status === "ok") {
      return [
        DEFAULT_DEVICE_ENTRY,
        ...result.data.filter(
          (d) => d.name.toLowerCase() !== BACKEND_DEFAULT_DEVICE_NAME,
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

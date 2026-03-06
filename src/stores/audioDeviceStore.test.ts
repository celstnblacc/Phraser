import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "@/bindings";
import { DEFAULT_DEVICE_ENTRY, useAudioDeviceStore } from "./audioDeviceStore";

beforeEach(() => {
  useAudioDeviceStore.setState({ audioDevices: [], outputDevices: [] });
  vi.clearAllMocks();
});

describe("audioDeviceStore — refreshAudioDevices", () => {
  it("prepends the sentinel Default entry", async () => {
    vi.mocked(commands.getAvailableMicrophones).mockResolvedValue({
      status: "ok",
      data: [{ index: "1", name: "Built-in Mic", is_default: false }],
    });

    await useAudioDeviceStore.getState().refreshAudioDevices();

    const devices = useAudioDeviceStore.getState().audioDevices;
    expect(devices[0]).toEqual(DEFAULT_DEVICE_ENTRY);
    expect(devices[1].name).toBe("Built-in Mic");
  });

  it("filters out any backend 'Default' entry to avoid duplicates", async () => {
    vi.mocked(commands.getAvailableMicrophones).mockResolvedValue({
      status: "ok",
      data: [
        { index: "default", name: "Default", is_default: true },
        { index: "1", name: "Built-in Mic", is_default: false },
      ],
    });

    await useAudioDeviceStore.getState().refreshAudioDevices();

    const devices = useAudioDeviceStore.getState().audioDevices;
    // Only one Default entry — our sentinel, not the backend's.
    const defaultEntries = devices.filter(
      (d) => d.name.toLowerCase() === "default",
    );
    expect(defaultEntries).toHaveLength(1);
    expect(defaultEntries[0]).toEqual(DEFAULT_DEVICE_ENTRY);
    expect(devices).toHaveLength(2);
  });

  it("falls back to sentinel-only list on backend error", async () => {
    vi.mocked(commands.getAvailableMicrophones).mockResolvedValue({
      status: "error",
      error: "Permission denied",
    });

    await useAudioDeviceStore.getState().refreshAudioDevices();

    expect(useAudioDeviceStore.getState().audioDevices).toEqual([
      DEFAULT_DEVICE_ENTRY,
    ]);
  });

  it("falls back to sentinel-only list on thrown exception", async () => {
    vi.mocked(commands.getAvailableMicrophones).mockRejectedValue(
      new Error("IPC failure"),
    );

    await useAudioDeviceStore.getState().refreshAudioDevices();

    expect(useAudioDeviceStore.getState().audioDevices).toEqual([
      DEFAULT_DEVICE_ENTRY,
    ]);
  });
});

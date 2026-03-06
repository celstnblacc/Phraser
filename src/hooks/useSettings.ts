import { useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useAudioDeviceStore } from "../stores/audioDeviceStore";
import { usePostProcessStore } from "../stores/postProcessStore";
import type { AppSettings as Settings, AudioDevice } from "@/bindings";

interface UseSettingsReturn {
  // State
  settings: Settings | null;
  isLoading: boolean;
  isUpdating: (key: string) => boolean;
  audioDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  audioFeedbackEnabled: boolean;
  postProcessModelOptions: Record<string, string[]>;

  // Actions
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => Promise<void>;
  resetSetting: (key: keyof Settings) => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  refreshOutputDevices: () => Promise<void>;

  // Binding-specific actions
  updateBinding: (id: string, binding: string) => Promise<void>;
  resetBinding: (id: string) => Promise<void>;

  // Convenience getters
  getSetting: <K extends keyof Settings>(key: K) => Settings[K] | undefined;

  // Post-processing helpers
  setPostProcessProvider: (providerId: string) => Promise<void>;
  updatePostProcessBaseUrl: (
    providerId: string,
    baseUrl: string,
  ) => Promise<void>;
  updatePostProcessApiKey: (
    providerId: string,
    apiKey: string,
  ) => Promise<void>;
  updatePostProcessModel: (providerId: string, model: string) => Promise<void>;
  fetchPostProcessModels: (providerId: string) => Promise<string[]>;
}

export const useSettings = (): UseSettingsReturn => {
  const store = useSettingsStore();
  const audioStore = useAudioDeviceStore();
  const postProcessStore = usePostProcessStore();

  // Initialize on first mount
  useEffect(() => {
    if (store.isLoading) {
      store.initialize();
    }
  }, [store.initialize, store.isLoading]);

  return {
    settings: store.settings,
    isLoading: store.isLoading,
    isUpdating: store.isUpdatingKey,
    audioDevices: audioStore.audioDevices,
    outputDevices: audioStore.outputDevices,
    audioFeedbackEnabled: store.settings?.audio_feedback ?? false,
    postProcessModelOptions: postProcessStore.modelOptions,
    updateSetting: store.updateSetting,
    resetSetting: store.resetSetting,
    refreshSettings: store.refreshSettings,
    refreshAudioDevices: audioStore.refreshAudioDevices,
    refreshOutputDevices: audioStore.refreshOutputDevices,
    updateBinding: store.updateBinding,
    resetBinding: store.resetBinding,
    getSetting: store.getSetting,
    // The hook is the coordination layer between stores. Cross-store side-effects
    // (clearing cached model options) are orchestrated here, keeping each store
    // responsible for only its own state.
    //
    // Clearing contract for all three mutations below: always safe regardless of
    // outcome. The store functions swallow errors internally, so success cannot be
    // detected here. On failure the stale list is gone; on success the changed
    // provider/key/url starts fresh. The user re-fetches models either way.
    setPostProcessProvider: async (providerId) => {
      await store.setPostProcessProvider(providerId);
      postProcessStore.clearModelOptions(providerId);
    },
    updatePostProcessBaseUrl: async (providerId, baseUrl) => {
      await store.updatePostProcessBaseUrl(providerId, baseUrl);
      postProcessStore.clearModelOptions(providerId);
    },
    updatePostProcessApiKey: async (providerId, apiKey) => {
      await store.updatePostProcessApiKey(providerId, apiKey);
      postProcessStore.clearModelOptions(providerId);
    },
    updatePostProcessModel: store.updatePostProcessModel,
    // Loading state for model fetches is managed by callers; this is a thin pass-through.
    fetchPostProcessModels: postProcessStore.fetchModels,
  };
};

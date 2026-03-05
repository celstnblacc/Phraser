import { create } from "zustand";
import { commands } from "@/bindings";

interface PostProcessStore {
  /** Cached model lists keyed by provider ID. Empty array = not yet fetched. */
  modelOptions: Record<string, string[]>;
  setModelOptions: (providerId: string, models: string[]) => void;
  clearModelOptions: (providerId: string) => void;
  fetchModels: (providerId: string) => Promise<string[]>;
}

export const usePostProcessStore = create<PostProcessStore>()((set, get) => ({
  modelOptions: {},

  setModelOptions: (providerId, models) =>
    set((state) => ({
      modelOptions: { ...state.modelOptions, [providerId]: models },
    })),

  clearModelOptions: (providerId) =>
    set((state) => ({
      modelOptions: { ...state.modelOptions, [providerId]: [] },
    })),

  fetchModels: async (providerId) => {
    try {
      const result = await commands.fetchPostProcessModels(providerId);
      if (result.status === "ok") {
        get().setModelOptions(providerId, result.data);
        return result.data;
      }
      console.error("Failed to fetch post-process models:", result.error);
      return [];
    } catch (error) {
      console.error("Failed to fetch post-process models:", error);
      // Don't cache empty array on error — let the user retry.
      return [];
    }
  },
}));

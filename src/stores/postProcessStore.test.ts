import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "@/bindings";
import { usePostProcessStore } from "./postProcessStore";

// Reset store state between tests so they don't bleed into each other.
beforeEach(() => {
  usePostProcessStore.setState({ modelOptions: {} });
  vi.clearAllMocks();
});

describe("postProcessStore — fetchModels", () => {
  it("populates modelOptions on success", async () => {
    vi.mocked(commands.fetchPostProcessModels).mockResolvedValue({
      status: "ok",
      data: ["gpt-4o", "gpt-4o-mini"],
    });

    const result = await usePostProcessStore.getState().fetchModels("openai");

    expect(result).toEqual(["gpt-4o", "gpt-4o-mini"]);
    expect(usePostProcessStore.getState().modelOptions["openai"]).toEqual([
      "gpt-4o",
      "gpt-4o-mini",
    ]);
  });

  it("returns empty array on backend error and does NOT cache it", async () => {
    vi.mocked(commands.fetchPostProcessModels).mockResolvedValue({
      status: "error",
      error: "Invalid API key",
    });

    const result = await usePostProcessStore.getState().fetchModels("openai");

    expect(result).toEqual([]);
    // Must not cache the empty array — user should be able to retry.
    expect(
      usePostProcessStore.getState().modelOptions["openai"],
    ).toBeUndefined();
  });

  it("returns empty array on thrown exception and does NOT cache it", async () => {
    vi.mocked(commands.fetchPostProcessModels).mockRejectedValue(
      new Error("Network error"),
    );

    const result = await usePostProcessStore
      .getState()
      .fetchModels("anthropic");

    expect(result).toEqual([]);
    expect(
      usePostProcessStore.getState().modelOptions["anthropic"],
    ).toBeUndefined();
  });

  it("isolates model options by provider ID", async () => {
    vi.mocked(commands.fetchPostProcessModels)
      .mockResolvedValueOnce({ status: "ok", data: ["claude-3-5-sonnet"] })
      .mockResolvedValueOnce({ status: "ok", data: ["gemini-2.0-flash"] });

    await usePostProcessStore.getState().fetchModels("anthropic");
    await usePostProcessStore.getState().fetchModels("gemini");

    const { modelOptions } = usePostProcessStore.getState();
    expect(modelOptions["anthropic"]).toEqual(["claude-3-5-sonnet"]);
    expect(modelOptions["gemini"]).toEqual(["gemini-2.0-flash"]);
  });
});

describe("postProcessStore — clearModelOptions", () => {
  it("clears options for the given provider only", () => {
    usePostProcessStore.setState({
      modelOptions: {
        openai: ["gpt-4o"],
        anthropic: ["claude-3-5-sonnet"],
      },
    });

    usePostProcessStore.getState().clearModelOptions("openai");

    const { modelOptions } = usePostProcessStore.getState();
    expect(modelOptions["openai"]).toEqual([]);
    expect(modelOptions["anthropic"]).toEqual(["claude-3-5-sonnet"]);
  });
});

describe("postProcessStore — setModelOptions", () => {
  it("sets options and overwrites existing ones for the same provider", () => {
    usePostProcessStore.setState({ modelOptions: { openai: ["gpt-4"] } });

    usePostProcessStore.getState().setModelOptions("openai", ["gpt-4o", "o3"]);

    expect(usePostProcessStore.getState().modelOptions["openai"]).toEqual([
      "gpt-4o",
      "o3",
    ]);
  });
});

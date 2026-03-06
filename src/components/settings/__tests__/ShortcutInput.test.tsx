import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";

import { ShortcutInput } from "../ShortcutInput";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

// Lightweight stand-ins — real implementations make Tauri calls.
vi.mock("../GlobalShortcutInput", () => ({
  GlobalShortcutInput: () => <div data-testid="global-shortcut-input" />,
}));
vi.mock("../HandyKeysShortcutInput", () => ({
  HandyKeysShortcutInput: () => <div data-testid="handy-keys-shortcut-input" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ShortcutInput", () => {
  it("renders GlobalShortcutInput when keyboard_implementation is not set", () => {
    mockUseSettings.mockReturnValue(makeSettings({}));
    render(<ShortcutInput shortcutId="toggle_transcription" />);
    expect(screen.getByTestId("global-shortcut-input")).toBeInTheDocument();
    expect(
      screen.queryByTestId("handy-keys-shortcut-input"),
    ).not.toBeInTheDocument();
  });

  it("renders GlobalShortcutInput when keyboard_implementation is 'tauri'", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ keyboard_implementation: "tauri" } as any),
    );
    render(<ShortcutInput shortcutId="toggle_transcription" />);
    expect(screen.getByTestId("global-shortcut-input")).toBeInTheDocument();
  });

  it("renders HandyKeysShortcutInput when keyboard_implementation is 'handy_keys'", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ keyboard_implementation: "handy_keys" } as any),
    );
    render(<ShortcutInput shortcutId="toggle_transcription" />);
    expect(screen.getByTestId("handy-keys-shortcut-input")).toBeInTheDocument();
    expect(
      screen.queryByTestId("global-shortcut-input"),
    ).not.toBeInTheDocument();
  });
});

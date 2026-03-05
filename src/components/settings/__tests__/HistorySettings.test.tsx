import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "@/bindings";
import type { HistoryEntry } from "@/bindings";

import { HistorySettings } from "../history/HistorySettings";

// Event listener — return a no-op unlisten function.
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn().mockResolvedValue(new Uint8Array()),
}));

vi.mock("@/stores/modelStore", () => ({
  useModelStore: vi
    .fn()
    .mockImplementation((selector: (s: { models: [] }) => unknown) =>
      selector({ models: [] }),
    ),
}));

const mockCommands = vi.mocked(commands);

const SAMPLE_ENTRY: HistoryEntry = {
  id: 1,
  title: "Hello world",
  timestamp: 1704110400000,
  transcription_text: "Hello world",
  post_processed_text: null,
  post_process_prompt: null,
  post_process_action_key: null,
  file_name: "recording_1.wav",
  saved: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HistorySettings — loading state", () => {
  it("shows loading text while fetching entries", () => {
    // Never resolves — component stays in loading state
    mockCommands.getHistoryEntries.mockReturnValue(new Promise(() => {}));
    render(<HistorySettings />);
    expect(screen.getByText("settings.history.loading")).toBeInTheDocument();
  });
});

describe("HistorySettings — empty state", () => {
  it("shows empty message when there are no entries", async () => {
    mockCommands.getHistoryEntries.mockResolvedValue({
      status: "ok",
      data: [],
    } as any);
    render(<HistorySettings />);
    await waitFor(() => {
      expect(screen.getByText("settings.history.empty")).toBeInTheDocument();
    });
  });
});

describe("HistorySettings — with entries", () => {
  beforeEach(() => {
    mockCommands.getHistoryEntries.mockResolvedValue({
      status: "ok",
      data: [SAMPLE_ENTRY],
    } as any);
  });

  it("renders the history title", async () => {
    render(<HistorySettings />);
    await waitFor(() => {
      expect(
        screen.getAllByText("settings.history.title").length,
      ).toBeGreaterThan(0);
    });
  });

  it("renders the transcription text for an entry", async () => {
    render(<HistorySettings />);
    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("renders the open folder button", async () => {
    render(<HistorySettings />);
    await waitFor(() => {
      expect(
        screen.getByText("settings.history.openFolder"),
      ).toBeInTheDocument();
    });
  });

  it("calls openRecordingsFolder command when folder button is clicked", async () => {
    mockCommands.openRecordingsFolder = vi.fn().mockResolvedValue(undefined);
    render(<HistorySettings />);
    await waitFor(() => screen.getByText("settings.history.openFolder"));
    await userEvent.click(screen.getByText("settings.history.openFolder"));
    expect(mockCommands.openRecordingsFolder).toHaveBeenCalled();
  });

  it("calls toggleHistoryEntrySaved when star button is clicked", async () => {
    mockCommands.toggleHistoryEntrySaved = vi.fn().mockResolvedValue(undefined);
    render(<HistorySettings />);
    await waitFor(() => screen.getByText("Hello world"));
    const saveButton = screen.getByTitle("settings.history.save");
    await userEvent.click(saveButton);
    expect(mockCommands.toggleHistoryEntrySaved).toHaveBeenCalledWith(1);
  });

  it("calls deleteHistoryEntry when delete button is clicked", async () => {
    mockCommands.deleteHistoryEntry = vi.fn().mockResolvedValue(undefined);
    render(<HistorySettings />);
    await waitFor(() => screen.getByText("Hello world"));
    const deleteButton = screen.getByTitle("settings.history.delete");
    await userEvent.click(deleteButton);
    expect(mockCommands.deleteHistoryEntry).toHaveBeenCalledWith(1);
  });

  it("shows post-processed text when present", async () => {
    const entryWithPostProcess: HistoryEntry = {
      ...SAMPLE_ENTRY,
      post_processed_text: "Post processed result",
    };
    mockCommands.getHistoryEntries.mockResolvedValue({
      status: "ok",
      data: [entryWithPostProcess],
    } as any);
    render(<HistorySettings />);
    await waitFor(() => {
      expect(screen.getByText("Post processed result")).toBeInTheDocument();
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });
});

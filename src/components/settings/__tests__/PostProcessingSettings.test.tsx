/* eslint-disable i18next/no-literal-string */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { PostProcessingSettings } from "../post-processing/PostProcessingSettings";
import { makeSettings, DEFAULT_ACTIONS } from "@/test/mockSettings";
import { commands } from "@/bindings";

const mockRefreshSettings = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/useSettings", () => ({
  useSettings: vi.fn(),
}));

import { useSettings } from "@/hooks/useSettings";

function setup(actions = DEFAULT_ACTIONS) {
  vi.mocked(useSettings).mockReturnValue(
    makeSettings(
      { post_process_actions: actions, saved_processing_models: [] },
      { refreshSettings: mockRefreshSettings },
    ),
  );
  return render(<PostProcessingSettings />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PostProcessingSettings", () => {
  it("renders the section title", () => {
    setup();
    // Title appears in both SettingsGroup (h2) and SettingContainer (h3)
    const titles = screen.getAllByText("settings.postProcessing.actions.title");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("lists the 2 default actions", () => {
    setup();
    expect(screen.getByText("Summarize")).toBeInTheDocument();
    expect(screen.getByText("Fix Grammar")).toBeInTheDocument();
  });

  it("shows the key badge for each action", () => {
    setup();
    const badges = screen.getAllByText(/^[1-9]$/);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no actions are configured", () => {
    setup([]);
    expect(
      screen.getByText("settings.postProcessing.actions.createFirst"),
    ).toBeInTheDocument();
  });

  it("shows Add Action button when fewer than 9 actions exist", () => {
    setup();
    expect(
      screen.getByText("settings.postProcessing.actions.addAction"),
    ).toBeInTheDocument();
  });

  it("opens edit form when an action is clicked", async () => {
    setup();
    await userEvent.click(screen.getByText("Summarize"));
    expect(screen.getByDisplayValue("Summarize")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Summarize the following text:"),
    ).toBeInTheDocument();
  });

  it("calls deletePostProcessAction and refreshes when form delete is clicked", async () => {
    setup();
    await userEvent.click(screen.getByText("Summarize"));
    // In the edit form there are Cancel and Delete buttons; Delete is last
    const deleteBtns = screen.getAllByText(
      "settings.postProcessing.actions.delete",
    );
    await userEvent.click(deleteBtns[deleteBtns.length - 1]);
    expect(vi.mocked(commands.deletePostProcessAction)).toHaveBeenCalledWith(1);
    await waitFor(() => expect(mockRefreshSettings).toHaveBeenCalled());
  });

  it("opens create form with next available key when Add Action is clicked", async () => {
    setup();
    await userEvent.click(
      screen.getByText("settings.postProcessing.actions.addAction"),
    );
    // Keys 1 and 2 are used; key 3 should be pre-assigned
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("save button is disabled when name or prompt is empty", async () => {
    setup([]);
    await userEvent.click(
      screen.getByText("settings.postProcessing.actions.addAction"),
    );
    const saveBtn = screen.getByText("settings.postProcessing.actions.save");
    expect(saveBtn).toBeDisabled();
  });

  it("calls addPostProcessAction and refreshes on save", async () => {
    setup([]);
    await userEvent.click(
      screen.getByText("settings.postProcessing.actions.addAction"),
    );
    const nameInput = screen.getByPlaceholderText(
      "settings.postProcessing.actions.namePlaceholder",
    );
    const promptInput = screen.getByPlaceholderText(
      "settings.postProcessing.actions.promptPlaceholder",
    );
    await userEvent.type(nameInput, "Translate");
    await userEvent.type(promptInput, "Translate to French:");
    fireEvent.click(screen.getByText("settings.postProcessing.actions.save"));
    await waitFor(() =>
      expect(vi.mocked(commands.addPostProcessAction)).toHaveBeenCalledWith(
        1,
        "Translate",
        "Translate to French:",
        null,
        null,
      ),
    );
    await waitFor(() => expect(mockRefreshSettings).toHaveBeenCalled());
  });

  it("cancel button closes the form without saving", async () => {
    setup();
    await userEvent.click(screen.getByText("Summarize"));
    await userEvent.click(
      screen.getByText("settings.postProcessing.actions.cancel"),
    );
    expect(screen.queryByDisplayValue("Summarize")).not.toBeInTheDocument();
    expect(vi.mocked(commands.updatePostProcessAction)).not.toHaveBeenCalled();
  });
});

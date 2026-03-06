import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";
import { toast } from "sonner";

import { CustomWords } from "../CustomWords";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CustomWords", () => {
  it("renders the title", () => {
    mockUseSettings.mockReturnValue(makeSettings({ custom_words: [] }));
    render(<CustomWords />);
    expect(
      screen.getByText("settings.advanced.customWords.title"),
    ).toBeInTheDocument();
  });

  it("renders the placeholder on the input", () => {
    mockUseSettings.mockReturnValue(makeSettings({ custom_words: [] }));
    render(<CustomWords />);
    expect(
      screen.getByPlaceholderText("settings.advanced.customWords.placeholder"),
    ).toBeInTheDocument();
  });

  it("shows existing words as buttons", () => {
    mockUseSettings.mockReturnValue(
      makeSettings({ custom_words: ["hello", "world"] }),
    );
    render(<CustomWords />);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("add button is disabled when input is empty", () => {
    mockUseSettings.mockReturnValue(makeSettings({ custom_words: [] }));
    render(<CustomWords />);
    const addButton = screen.getByRole("button", {
      name: "settings.advanced.customWords.add",
    });
    expect(addButton).toBeDisabled();
  });

  it("add button is disabled when input contains a space", async () => {
    mockUseSettings.mockReturnValue(makeSettings({ custom_words: [] }));
    render(<CustomWords />);
    const input = screen.getByPlaceholderText(
      "settings.advanced.customWords.placeholder",
    );
    await userEvent.type(input, "two words");
    const addButton = screen.getByRole("button", {
      name: "settings.advanced.customWords.add",
    });
    expect(addButton).toBeDisabled();
  });

  it("calls updateSetting with new word when add button is clicked", async () => {
    const settings = makeSettings({ custom_words: [] });
    mockUseSettings.mockReturnValue(settings);
    render(<CustomWords />);
    const input = screen.getByPlaceholderText(
      "settings.advanced.customWords.placeholder",
    );
    await userEvent.type(input, "newword");
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.advanced.customWords.add",
      }),
    );
    expect(settings.updateSetting).toHaveBeenCalledWith("custom_words", [
      "newword",
    ]);
  });

  it("calls updateSetting when Enter key is pressed", async () => {
    const settings = makeSettings({ custom_words: [] });
    mockUseSettings.mockReturnValue(settings);
    render(<CustomWords />);
    const input = screen.getByPlaceholderText(
      "settings.advanced.customWords.placeholder",
    );
    await userEvent.type(input, "newword{Enter}");
    expect(settings.updateSetting).toHaveBeenCalledWith("custom_words", [
      "newword",
    ]);
  });

  it("shows toast error on duplicate word", async () => {
    mockUseSettings.mockReturnValue(makeSettings({ custom_words: ["hello"] }));
    render(<CustomWords />);
    const input = screen.getByPlaceholderText(
      "settings.advanced.customWords.placeholder",
    );
    await userEvent.type(input, "hello{Enter}");
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
  });

  it("calls updateSetting to remove a word when its button is clicked", () => {
    const settings = makeSettings({ custom_words: ["hello", "world"] });
    mockUseSettings.mockReturnValue(settings);
    render(<CustomWords />);
    // Both word buttons share the same aria-label key — click the first one ("hello").
    const removeButtons = screen.getAllByRole("button", {
      name: "settings.advanced.customWords.remove",
    });
    fireEvent.click(removeButtons[0]);
    expect(settings.updateSetting).toHaveBeenCalledWith("custom_words", [
      "world",
    ]);
  });

  it("strips special chars from input before adding", async () => {
    const settings = makeSettings({ custom_words: [] });
    mockUseSettings.mockReturnValue(settings);
    render(<CustomWords />);
    const input = screen.getByPlaceholderText(
      "settings.advanced.customWords.placeholder",
    );
    await userEvent.type(input, "hel<lo{Enter}");
    expect(settings.updateSetting).toHaveBeenCalledWith("custom_words", [
      "hello",
    ]);
  });
});

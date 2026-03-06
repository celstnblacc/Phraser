import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";

import { AboutSettings } from "../about/AboutSettings";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("1.2.3"),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn().mockResolvedValue(undefined),
}));

// AppDataDirectory and LogDirectory make Tauri calls — stub them.
vi.mock("../AppDataDirectory", () => ({
  AppDataDirectory: () => <div data-testid="app-data-directory" />,
}));
vi.mock("../debug", () => ({
  LogDirectory: () => <div data-testid="log-directory" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSettings.mockReturnValue(makeSettings({ app_language: "en" }));
});

describe("AboutSettings", () => {
  it("renders the about title", async () => {
    render(<AboutSettings />);
    await waitFor(() => {
      expect(screen.getByText("settings.about.title")).toBeInTheDocument();
    });
  });

  it("displays the app version fetched from Tauri", async () => {
    render(<AboutSettings />);
    await waitFor(() => {
      expect(screen.getByText("v1.2.3")).toBeInTheDocument();
    });
  });

  it("falls back to version string on error", async () => {
    const { getVersion } = await import("@tauri-apps/api/app");
    vi.mocked(getVersion).mockRejectedValueOnce(new Error("fail"));
    render(<AboutSettings />);
    await waitFor(() => {
      expect(screen.getByText("v0.1.2")).toBeInTheDocument();
    });
  });

  it("renders the donate button", async () => {
    render(<AboutSettings />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "settings.about.supportDevelopment.button",
        }),
      ).toBeInTheDocument();
    });
  });

  it("opens the donate URL when donate button is clicked", async () => {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    render(<AboutSettings />);
    await waitFor(() =>
      screen.getByRole("button", {
        name: "settings.about.supportDevelopment.button",
      }),
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: "settings.about.supportDevelopment.button",
      }),
    );
    expect(openUrl).toHaveBeenCalledWith(expect.stringContaining("donate"));
  });

  it("renders the source code button", async () => {
    render(<AboutSettings />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "settings.about.sourceCode.button",
        }),
      ).toBeInTheDocument();
    });
  });

  it("renders the acknowledgments section", async () => {
    render(<AboutSettings />);
    await waitFor(() => {
      expect(
        screen.getByText("settings.about.acknowledgments.title"),
      ).toBeInTheDocument();
    });
  });
});

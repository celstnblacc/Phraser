import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "../Sidebar";
import { useSettings } from "@/hooks/useSettings";
import { makeSettings } from "@/test/mockSettings";

vi.mock("@/hooks/useSettings");
const mockUseSettings = vi.mocked(useSettings);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSettings.mockReturnValue(makeSettings({ debug_mode: false }));
});

describe("Sidebar", () => {
  it("renders all always-visible sections", () => {
    render(<Sidebar activeSection="general" onSectionChange={vi.fn()} />);
    expect(screen.getByText("sidebar.general")).toBeInTheDocument();
    expect(screen.getByText("sidebar.models")).toBeInTheDocument();
    expect(screen.getByText("sidebar.advanced")).toBeInTheDocument();
    expect(screen.getByText("sidebar.postProcessing")).toBeInTheDocument();
    expect(screen.getByText("sidebar.history")).toBeInTheDocument();
    expect(screen.getByText("sidebar.about")).toBeInTheDocument();
  });

  it("hides the debug section when debug_mode is false", () => {
    mockUseSettings.mockReturnValue(makeSettings({ debug_mode: false }));
    render(<Sidebar activeSection="general" onSectionChange={vi.fn()} />);
    expect(screen.queryByText("sidebar.debug")).not.toBeInTheDocument();
  });

  it("shows the debug section when debug_mode is true", () => {
    mockUseSettings.mockReturnValue(makeSettings({ debug_mode: true }));
    render(<Sidebar activeSection="general" onSectionChange={vi.fn()} />);
    expect(screen.getByText("sidebar.debug")).toBeInTheDocument();
  });

  it("calls onSectionChange with the clicked section id", async () => {
    const onSectionChange = vi.fn();
    render(
      <Sidebar activeSection="general" onSectionChange={onSectionChange} />,
    );
    await userEvent.click(screen.getByText("sidebar.advanced"));
    expect(onSectionChange).toHaveBeenCalledWith("advanced");
  });

  it("highlights the active section", () => {
    render(<Sidebar activeSection="models" onSectionChange={vi.fn()} />);
    // The active section container has bg-logo-primary/80 class
    const activeItem = screen.getByText("sidebar.models").closest("div");
    expect(activeItem).toHaveClass("bg-logo-primary/80");
  });
});

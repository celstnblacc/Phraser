import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToggleSwitch } from "../ToggleSwitch";

const baseProps = {
  checked: false,
  onChange: vi.fn(),
  label: "settings.sound.audioFeedback.label",
  description: "settings.sound.audioFeedback.description",
};

describe("ToggleSwitch", () => {
  it("renders the label", () => {
    render(<ToggleSwitch {...baseProps} />);
    expect(
      screen.getByText("settings.sound.audioFeedback.label"),
    ).toBeInTheDocument();
  });

  it("checkbox is unchecked when checked=false", () => {
    render(<ToggleSwitch {...baseProps} checked={false} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("checkbox is checked when checked=true", () => {
    render(<ToggleSwitch {...baseProps} checked={true} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onChange with true when toggled on", async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch {...baseProps} checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when toggled off", async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch {...baseProps} checked={true} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("checkbox is disabled when disabled=true", () => {
    render(<ToggleSwitch {...baseProps} disabled={true} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("checkbox is disabled when isUpdating=true", () => {
    render(<ToggleSwitch {...baseProps} isUpdating={true} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("does not call onChange when disabled", async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch {...baseProps} disabled={true} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });
});

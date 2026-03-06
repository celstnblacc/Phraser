import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "../Slider";

const baseProps = {
  value: 0.5,
  onChange: vi.fn(),
  min: 0,
  max: 1,
  step: 0.1,
  label: "settings.sound.volume.title",
  description: "settings.sound.volume.description",
  formatValue: (v: number) => `${Math.round(v * 100)}%`,
};

describe("Slider", () => {
  it("renders the label", () => {
    render(<Slider {...baseProps} />);
    expect(screen.getByText("settings.sound.volume.title")).toBeInTheDocument();
  });

  it("shows the formatted value", () => {
    render(
      <Slider
        {...baseProps}
        value={0.7}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />,
    );
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("calls onChange when the range input changes", () => {
    const onChange = vi.fn();
    render(<Slider {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.8" } });
    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it("range input is disabled when disabled=true", () => {
    render(<Slider {...baseProps} disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("hides formatted value when showValue=false", () => {
    render(<Slider {...baseProps} showValue={false} />);
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });
});

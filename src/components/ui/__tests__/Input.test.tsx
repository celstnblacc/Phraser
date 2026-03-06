import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("renders with given value", () => {
    render(<Input value="hello" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("calls onChange when user types", () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "new" },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders placeholder text", () => {
    render(<Input value="" onChange={vi.fn()} placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Input value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled opacity class when disabled", () => {
    render(<Input value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toHaveClass("opacity-60");
  });
});

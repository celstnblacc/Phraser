import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dropdown } from "../Dropdown";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("Dropdown", () => {
  it("shows the currently selected option", () => {
    render(<Dropdown options={options} selectedValue="b" onSelect={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Option B/ }),
    ).toBeInTheDocument();
  });

  it("shows placeholder when no option matches the selected value", () => {
    render(
      <Dropdown
        options={options}
        selectedValue={null}
        onSelect={vi.fn()}
        placeholder="Pick one..."
      />,
    );
    expect(screen.getByText("Pick one...")).toBeInTheDocument();
  });

  it("opens the list when trigger is clicked", async () => {
    render(<Dropdown options={options} selectedValue="a" onSelect={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Option A/ }));
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("calls onSelect with the chosen value", async () => {
    const onSelect = vi.fn();
    render(
      <Dropdown options={options} selectedValue="a" onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Option A/ }));
    await userEvent.click(screen.getByText("Option C"));
    expect(onSelect).toHaveBeenCalledWith("c");
  });

  it("does not open when disabled", async () => {
    render(
      <Dropdown
        options={options}
        selectedValue="a"
        onSelect={vi.fn()}
        disabled
      />,
    );
    // Disabled button — click is intercepted by handleToggle's guard
    const trigger = screen.getByRole("button");
    await userEvent.click(trigger);
    expect(screen.queryByText("Option B")).not.toBeInTheDocument();
  });

  it("closes after an option is selected", async () => {
    render(<Dropdown options={options} selectedValue="a" onSelect={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /Option A/ }));
    await userEvent.click(screen.getByText("Option B"));
    expect(screen.queryByText("Option C")).not.toBeInTheDocument();
  });
});

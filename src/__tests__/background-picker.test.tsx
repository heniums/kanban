import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackgroundPicker, BACKGROUNDS } from "@/components/boards/background-picker";

describe("BackgroundPicker", () => {
  it("renders a radio swatch for each preset background", () => {
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={vi.fn()} />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches).toHaveLength(BACKGROUNDS.length);
  });

  it("marks the selected value with aria-checked=true", () => {
    render(<BackgroundPicker value={BACKGROUNDS[1].value} onChange={vi.fn()} />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches[1].getAttribute("aria-checked")).toBe("true");
    expect(swatches[0].getAttribute("aria-checked")).toBe("false");
  });

  it("calls onChange when a swatch is clicked", async () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={onChange} />);

    const swatches = screen.getAllByRole("radio");
    await userEvent.click(swatches[2]);

    expect(onChange).toHaveBeenCalledWith(BACKGROUNDS[2].value);
  });

  it("applies the background value as inline style to each swatch", () => {
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={vi.fn()} />);

    const swatches = screen.getAllByRole("radio");
    expect(swatches[0].style.background).toBeTruthy();
  });

  it("selects the next swatch via ArrowRight key", async () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={onChange} />);

    const swatches = screen.getAllByRole("radio");
    swatches[0].focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(BACKGROUNDS[1].value);
  });

  it("selects the previous swatch via ArrowLeft key (wraps)", async () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={onChange} />);

    const swatches = screen.getAllByRole("radio");
    swatches[0].focus();
    await userEvent.keyboard("{ArrowLeft}");

    expect(onChange).toHaveBeenCalledWith(BACKGROUNDS[BACKGROUNDS.length - 1].value);
  });

  it("renders a radiogroup with an accessible label", () => {
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup").getAttribute("aria-label")).toBe("Board background");
  });

  it("renders a custom color picker button", () => {
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Custom color")).toBeTruthy();
  });

  it("calls onChange when a custom color is picked", async () => {
    const onChange = vi.fn();
    render(<BackgroundPicker value={BACKGROUNDS[0].value} onChange={onChange} />);

    const colorInput = screen.getByLabelText("Custom color").querySelector("input")!;
    // fireEvent.change triggers the onChange handler on the color input
    fireEvent.change(colorInput, { target: { value: "#ff0000" } });

    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });

  it("renders custom color preview when value is not a preset", () => {
    render(<BackgroundPicker value="#ff0000" onChange={vi.fn()} />);

    // No radio should be checked since this is a custom color
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio.getAttribute("aria-checked")).toBe("false");
    });
  });
});

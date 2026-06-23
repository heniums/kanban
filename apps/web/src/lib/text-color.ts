const DARK_TEXT = "#0a0a0a";
const LIGHT_TEXT = "white";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const GRADIENT_RE = /^(?:linear|radial)-gradient\(.+\)$/;

function expandHex(hex: string): [number, number, number] | null {
  if (!HEX_RE.test(hex)) return null;
  const raw = hex.slice(1);
  if (raw.length === 3) {
    return [
      parseInt(raw[0] + raw[0], 16),
      parseInt(raw[1] + raw[1], 16),
      parseInt(raw[2] + raw[2], 16),
    ];
  }
  return [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getTextColor(background: string): string {
  if (GRADIENT_RE.test(background)) {
    return LIGHT_TEXT;
  }
  const rgb = expandHex(background);
  if (!rgb) {
    return LIGHT_TEXT;
  }
  const luminance = relativeLuminance(...rgb);
  return luminance > 0.5 ? DARK_TEXT : LIGHT_TEXT;
}

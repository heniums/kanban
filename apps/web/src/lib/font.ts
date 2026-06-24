import { Inter, Geist_Mono } from "next/font/google";

/**
 * The literal family name of the Inter font.
 * The same literal is repeated inside the `Inter()` call below because
 * `next/font/google` requires font loader values to be explicitly written
 * literals (it cannot accept a constant reference).
 */
const INTER_FONT_NAME = "Inter";

/** CSS custom property that exposes the loaded Inter font to the rest of the app. */
export const INTER_FONT_VARIABLE = "--font-inter";

export const inter = Inter({
  variable: INTER_FONT_VARIABLE,
  subsets: ["latin"],
  display: "swap",
  fallback: [INTER_FONT_NAME, "ui-sans-serif", "system-ui", "sans-serif"],
});

export const interMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

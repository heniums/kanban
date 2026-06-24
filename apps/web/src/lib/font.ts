import { Inter, Geist_Mono } from "next/font/google";

export const INTER_FONT_NAME = "Inter";
export const INTER_FONT_VARIABLE = "--font-inter";

export const inter = Inter({
  variable: INTER_FONT_VARIABLE,
  subsets: ["latin"],
  display: "swap",
  fallback: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
});

export const interMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

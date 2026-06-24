import { Inter, Geist_Mono } from "next/font/google";

export const inter = Inter({
  variable: '--font-inter',
  subsets: ["latin"],
  display: "swap",
  fallback: ['Inter', "ui-sans-serif", "system-ui", "sans-serif"],
});

export const interMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

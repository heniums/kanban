import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,
    exclude: [
      "**/node_modules/**",
      "e2e/**",
      ".next/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  resolve: {
    alias: [
      {
        find: "@/",
        replacement: path.resolve(__dirname, "src") + "/",
      },
      {
        find: /^server-only$/,
        replacement: path.resolve(__dirname, "src/__tests__/server-only-mock.ts"),
      },
    ],
  },
});

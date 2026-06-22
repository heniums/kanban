import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    css: false,
    exclude: ["**/node_modules/**", "e2e/**", ".next/**", "playwright-report/**", "test-results/**"],
  },
  resolve: {
    alias: [
      {
        find: "@/",
        replacement: path.resolve(__dirname, "src") + "/",
      },
      {
        find: "@kanban/shared",
        replacement: path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      },
    ],
  },
});
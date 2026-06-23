import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../apps/server/.env") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});

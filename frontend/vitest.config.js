import path from "path";
import * as url from "url";
import { defineConfig } from "vitest/config";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scoped to the areas this round of tests actually covers; broaden as more layers get tests
      include: ["src/lib/**"],
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Scoped to the areas this round of tests actually covers; broaden as more layers get tests
      include: ["utils/**"],
    },
  },
});

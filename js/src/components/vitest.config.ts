import { configDefaults, defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    globals: true,
    environment: "jsdom",
    setupFiles: [resolve(__dirname, "vitest.setup.ts")],
    coverage: {
      provider: "v8",
      exclude: [...configDefaults.coverage.exclude, "**/index.tsx"],
    },
  },
});

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * NOTE: This file is in JavaScript because Vitest does not
 * seem to support **shareable** TypeScript configurations.
 *
 * You can write your package's configuration as TypeScript.
 */

/**
 * Base configuration to extend from for all Vitest configurations.
 * @see https://vitest.dev/config/
 */
export const baseConfig = defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",

    coverage: {
      provider: "v8",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/test/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.test.*",
        "**/*.spec.*",
      ],

      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});

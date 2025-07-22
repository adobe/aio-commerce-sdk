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
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});

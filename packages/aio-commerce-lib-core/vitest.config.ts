import { baseConfig } from "@aio-commerce-sdk/config-vitest/vitest.config";
import { mergeConfig } from "vitest/config";

// Barrel files are those that only contain exports.
const BARREL_FILES = ["./source/index.ts", "./source/error/index.ts"];

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      // Exclude barrel files as they don't contain "logic".
      exclude: [...BARREL_FILES],
    },
  },
});

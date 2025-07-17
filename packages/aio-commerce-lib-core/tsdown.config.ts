import { baseConfig } from "@aio-commerce-sdk/config-tsdown/tsdown.config.base";
import { defineConfig } from "tsdown";

export default defineConfig({
  ...baseConfig,
  entry: [
    "./source/index.ts",
    "./source/lib/error.ts",
    "./source/lib/result.ts",
    "./source/lib/validation.ts",
  ],
});

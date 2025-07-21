import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "./source"),
      "~~": resolve(__dirname, "./"),
    },
  },

  test: {
    globals: true,
    environment: "node",
  },
});

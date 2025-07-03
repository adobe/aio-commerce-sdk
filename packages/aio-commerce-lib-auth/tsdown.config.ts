import { defineConfig } from "tsdown";

const OUT_DIR = "./dist";
export default defineConfig({
  entry: ["./source/index.ts"],
  format: ["cjs", "esm"],

  outputOptions: {
    legalComments: "inline",
    dir: OUT_DIR,
  },

  dts: true,
  treeshake: true,

  hooks: {
    "build:before": (ctx) => {
      if (ctx.buildOptions.output) {
        // Move each output into its own directory.
        const { format } = ctx.buildOptions.output;
        ctx.buildOptions.output.dir += `/${format}`;
      }
    },
  },
});

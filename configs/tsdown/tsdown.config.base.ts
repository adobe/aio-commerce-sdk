import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { globby } from "globby";

import type { UserConfig } from "tsdown";

/** By default, TSDown will output the files to the `./dist` directory. */
const OUT_DIR = "./dist";

/**
 * Base configuration to extend from for all TSDown configurations.
 * @see https://tsdown.dev/options/config-file
 */
export const baseConfig: UserConfig = {
  entry: [],
  format: ["cjs", "esm"],

  outputOptions: {
    legalComments: "inline",
    dir: OUT_DIR,
  },

  nodeProtocol: "strip",

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

    "build:done": async (_) => {
      // For some reason the types and sub-directories of the CJS builds are being placed out of the CJS directory.
      // This hook moves them after they're generated, respecting the directory structure.
      const files = await globby("**/*.d.cts", {
        cwd: OUT_DIR,
        absolute: true,
      });

      const migratedDirs = new Set<string>();
      await Promise.all(
        files.map(async (sourcePath) => {
          const relativePath = relative(OUT_DIR, sourcePath);
          const targetPath = join(OUT_DIR, "cjs", relativePath);

          if (relativePath.includes("/")) {
            const [root] = relativePath.split("/");
            const migratedDir = join(OUT_DIR, root);

            const [absoluteParent] = sourcePath.split(migratedDir);
            migratedDirs.add(join(absoluteParent, migratedDir));
          }

          await mkdir(dirname(targetPath), { recursive: true });
          await rename(sourcePath, targetPath);
        }),
      );

      await Promise.all(
        Array.from(migratedDirs).map(async (dir) => {
          await rm(dir, { recursive: true });
        }),
      );
    },
  },
};

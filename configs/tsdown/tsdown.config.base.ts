/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { globby } from "globby";

import type { UserConfig } from "tsdown";

const OUT_DIR = "./dist";
const ADOBE_LICENSE_BANNER = `
/**
 * @license
 * 
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
`.trimStart();

/**
 * Base configuration to extend from for all TSDown configurations.
 * @see https://tsdown.dev/options/config-file
 */
export const baseConfig: UserConfig = {
  entry: [],
  format: ["cjs", "esm"],

  outputOptions: {
    banner: ADOBE_LICENSE_BANNER,
    dir: OUT_DIR,

    minifyInternalExports: true,
  },

  nodeProtocol: "strip",
  minify: {
    compress: true,
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

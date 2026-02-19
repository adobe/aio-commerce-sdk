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

import { join } from "node:path";

import { privateDepsExtractionHook } from "./private-deps-extraction-hook.js";

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
 * @type {import("tsdown").UserConfig}
 */
export const baseConfig = {
  entry: [],
  format: {
    cjs: {
      outputOptions: {
        dir: join(OUT_DIR, "cjs"),
      },
    },
    esm: {
      outputOptions: {
        dir: join(OUT_DIR, "es"),
      },
    },
  },

  publint: true,
  outputOptions: {
    banner: ADOBE_LICENSE_BANNER,
    dir: OUT_DIR,

    minifyInternalExports: true,
  },

  nodeProtocol: "strip",
  minify: false,

  dts: true,
  treeshake: true,
  hooks(hooks) {
    hooks.hook("build:before", privateDepsExtractionHook);

    // Track if we've already installed (build:done runs per format)
    let hasInstalled = false;

    // Install dependencies after build if PUBLISH mode is enabled
    hooks.hook("build:done", async (ctx) => {
      if (hasInstalled) {
        return; // Already installed, skip
      }

      const shouldInstall =
        process.env.PUBLISH === "true" || process.argv.includes("--publish");

      if (!shouldInstall) {
        return;
      }

      hasInstalled = true;
      const { logger } = ctx.options;
      logger.info("Installing dependencies after build...");

      const { execSync } = await import("node:child_process");
      const { dirname } = await import("node:path");

      const packageDir = dirname(ctx.options.pkg.packageJsonPath);

      try {
        execSync("pnpm install --no-frozen-lockfile", {
          cwd: packageDir,
          stdio: "inherit",
        });
        logger.info("✓ Dependencies installed successfully");
      } catch (error) {
        logger.error("Failed to install dependencies:", error.message);
        // Don't fail the build, just warn
        logger.warn("Build completed but dependency installation failed");
      }
    });
  },
};

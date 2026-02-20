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

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { privatePackageExternalsPlugin } from "./plugins/private-package-externals.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Get the monorepo root (two levels up from configs/tsdown)
const MONOREPO_ROOT = join(__dirname, "../..");

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

  // Automatically externalize dependencies of private packages
  // when they are bundled via noExternal
  plugins: [
    privatePackageExternalsPlugin({
      projectRoot: MONOREPO_ROOT,
      privatePackagePatterns: ["packages-private/*"],
      verbose: false, // Set to true for debugging
    }),
  ],
};

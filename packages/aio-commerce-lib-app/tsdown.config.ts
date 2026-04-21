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

import { version as libConfigPkgVersion } from "@adobe/aio-commerce-lib-config/package.json" with {
  type: "json",
};
import { baseConfig } from "@aio-commerce-sdk/config-tsdown/tsdown.config.base";
import { mergeConfig } from "tsdown";

import { version as pkgVersion } from "./package.json" with { type: "json" };

export default mergeConfig(baseConfig, {
  entry: [
    "./source/actions/*.ts",
    "./source/config/index.ts",
    "./source/commands/index.ts",
    "./source/management/index.ts",
  ],
  define: {
    __PKG_VERSION__: JSON.stringify(pkgVersion),
    __LIB_CONFIG_RANGE__: JSON.stringify(`^${libConfigPkgVersion}`),
  },
  copy: [
    {
      from: "./source/commands/generate/actions/templates",
      to: "./dist/cjs/commands",
    },
    {
      from: "./source/commands/generate/actions/templates",
      to: "./dist/es/commands",
    },
  ],
});

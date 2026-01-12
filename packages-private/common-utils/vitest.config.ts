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

import { baseConfig } from "@aio-commerce-sdk/config-vitest/vitest.config.base";
import { defineConfig, mergeConfig } from "vitest/config";

// The default tsconfig-paths plugin is causing issues with the tests.
// This is because they conflict with Node's subpath imports,
// which we have started using because of this issue: https://github.com/vercel/turborepo/discussions/620
// A future PR needs to remove this from the base config and migrate everything to use subpath imports.
const { plugins: _, ...baseConfigWithoutPlugins } = baseConfig;

export default mergeConfig(
  baseConfigWithoutPlugins,
  defineConfig({
    plugins: [],
    test: {
      coverage: {
        thresholds: {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
      },
    },
  }),
);

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

const BARREL_FILES = [
  "./source/actions/index.ts",
  "./source/config/index.ts",
  "./source/management/index.ts",
  "./source/management/installation/events/index.ts",
  "./source/management/installation/webhooks/index.ts",
  "./source/management/installation/workflow/index.ts",
];

// Files with placeholder implementations pending full development
const PLACEHOLDER_FILES = [
  "./source/management/installation/webhooks/helpers.ts",
  "./source/management/installation/webhooks/branch.ts",
];

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [],
    test: {
      coverage: {
        // Exclude barrel files and placeholder implementations
        exclude: [...BARREL_FILES, ...PLACEHOLDER_FILES],
        thresholds: {
          // Temporarily reduce thresholds as tests will come in a separate PR
          lines: 35,
          statements: 35,
          functions: 35,
          branches: 35,
        },
      },
    },
  }),
);

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

// Barrel files are those that only contain exports.
const BARREL_FILES = ["./source/index.ts", "./source/error/index.ts"];

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        // Exclude barrel files as they don't contain "logic".
        exclude: [...BARREL_FILES],
      },
    },
  }),
);

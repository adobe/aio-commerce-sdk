/*
 * Copyright 2026 Adobe. All rights reserved.
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
import { playwright } from "@vitest/browser-playwright";
import { mergeConfig } from "vitest/config";

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      exclude: [
        "./source/**/index.ts",
        "./source/**/types.ts",
        "./source/web/runtime-loader.ts",
      ],
    },
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          exclude: ["test/unit/web/react/**"],
          include: ["test/unit/**/*.test.{ts,tsx}"],
          name: "node",
        },
      },
      {
        extends: true,
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright(),
          },
          include: ["test/unit/web/react/**/*.test.{ts,tsx}"],
          name: "browser",
        },
      },
    ],
  },
});

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

import { describe, expect, test } from "vitest";

import { defineConfig } from "~/config/lib/define";

describe("defineConfig", () => {
  test("should return the config as-is", () => {
    const config = {
      metadata: {
        id: "test-app",
        displayName: "Test App",
        description: "A test application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "testField",
            type: "text" as const,
            label: "Test Field",
          },
        ],
      },
    };

    const result = defineConfig(config);
    expect(result).toEqual(config);
    expect(result).toBe(config); // Should be the same reference
  });

  test("should work with minimal config", () => {
    const config = {
      metadata: {
        id: "minimal-app",
        displayName: "Minimal",
        description: "Minimal app",
        version: "1.0.0",
      },
    };

    const result = defineConfig(config);
    expect(result).toEqual(config);
  });
});

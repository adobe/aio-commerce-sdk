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

import { describe, expect, it } from "vitest";

import { buildActionDefinition } from "#commands/generate/actions/lib";

describe("buildActionDefinition", () => {
  it("build action definition only with mandatory fields", () => {
    const result = buildActionDefinition({
      name: "test-action",
      templateFile: "test-action.js.template",
    });

    expect(result).toEqual({
      function: ".generated/actions/app-management/test-action.js",
      web: "yes",
      runtime: "nodejs:22",
      annotations: {
        "require-adobe-auth": true,
        final: true,
      },
    });
  });

  it("creates action definition with optional fields (requiresSchema and requiresEncryptionKey) ", () => {
    const result = buildActionDefinition({
      name: "test-action",
      templateFile: "test-action.js.template",
      requiresSchema: true,
      requiresEncryptionKey: true,
    });

    expect(result).toEqual({
      function: ".generated/actions/app-management/test-action.js",
      web: "yes",
      runtime: "nodejs:22",
      annotations: {
        "require-adobe-auth": true,
        final: true,
      },
      include: [[".generated/configuration-schema.json", "app-management/"]],
      inputs: {
        CONFIG_ENCRYPTION_KEY: "$CONFIG_ENCRYPTION_KEY",
      },
    });
  });
});

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

import { buildBusinessConfigurationExtConfig } from "#commands/generate/actions/config";

describe("buildBusinessConfigurationExtConfig", () => {
  it("includes only REST action names in business configuration manifest", () => {
    const extConfig = buildBusinessConfigurationExtConfig();
    const actions =
      extConfig.runtimeManifest?.packages?.["app-management"]?.actions ?? {};

    expect(actions.config).toBeDefined();
    expect(actions["scope-tree"]).toBeDefined();
    expect(actions["set-configuration"]).toBeUndefined();
    expect(actions["get-configuration-versions"]).toBeUndefined();
    expect(actions["restore-configuration-version"]).toBeUndefined();
  });
});

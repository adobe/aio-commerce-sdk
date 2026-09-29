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

import { describe, expect, test } from "vitest";

import { buildLifecycleContext } from "#actions/installation/common";
import { createMockConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
  createMockInstallationParams,
  createMockLogger,
} from "#test/fixtures/installation";

describe("buildLifecycleContext", () => {
  test("takes the app id from the app config metadata", () => {
    const { appData } = createMockInstallationContext();
    const appConfig = createMockConfig({ metadata: { id: "my-app" } });
    const context = buildLifecycleContext(
      { ...createMockInstallationParams(), appConfig, appData },
      appConfig,
      createMockLogger(),
    );

    expect(context.appId).toBe("my-app");
  });
});

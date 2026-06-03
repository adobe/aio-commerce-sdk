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

import { vi } from "vitest";

import { createMockInstallationContext } from "#test/fixtures/installation";

import type { AdminUiSdkExecutionContext } from "#management/installation/admin-ui-sdk/utils";

/** Creates a mock AdminUiSdkExecutionContext with Admin UI SDK client methods. */
export function createMockAdminUiSdkContext(overrides?: {
  registerExtensionImpl?: () => Promise<{ extensionId: string }>;
  unregisterExtensionImpl?: () => Promise<unknown>;
}): AdminUiSdkExecutionContext {
  const mockInstallation = createMockInstallationContext();

  return {
    ...mockInstallation,
    adminUiSdkClient: {
      registerExtension: vi
        .fn()
        .mockImplementation(
          overrides?.registerExtensionImpl ??
            (() => Promise.resolve({ extensionId: "ext-123" })),
        ),
      unregisterExtension: vi
        .fn()
        .mockImplementation(
          overrides?.unregisterExtensionImpl ?? (() => Promise.resolve()),
        ),
    } as unknown as AdminUiSdkExecutionContext["adminUiSdkClient"],
  };
}

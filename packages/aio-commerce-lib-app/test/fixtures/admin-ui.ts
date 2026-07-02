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

export const viewButtonViewBase = {
  type: "view" as const,
  id: "delete-order",
  label: "Delete",
  path: "#/delete-order",
};

export const viewButtonWorkerBase = {
  type: "worker" as const,
  id: "sync-inventory",
  label: "Sync inventory",
  runtimeAction: "orders/sync-inventory",
};

import type { AdminUiExecutionContext } from "#management/installation/admin-ui/utils";

/** Creates a mock AdminUiExecutionContext with Admin UI client methods. */
export function createMockAdminUiContext(
  overrides?: NonNullable<
    Parameters<typeof createMockInstallationContext>[0]
  > & {
    enableAdminUiSdkImpl?: () => Promise<boolean>;
    registerExtensionImpl?: () => Promise<{ extensionId: string }>;
    unregisterExtensionImpl?: () => Promise<unknown>;
  },
): AdminUiExecutionContext {
  const mockInstallation = createMockInstallationContext(overrides);

  return {
    ...mockInstallation,
    adminUiClient: {
      enableAdminUiSdk: vi
        .fn()
        .mockImplementation(
          overrides?.enableAdminUiSdkImpl ?? (() => Promise.resolve(true)),
        ),
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
    },
  };
}

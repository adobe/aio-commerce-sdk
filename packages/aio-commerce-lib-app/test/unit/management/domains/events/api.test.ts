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

import { describe, expect, test, vi } from "vitest";

import { configureCommerceEventing } from "#management/domains/events/api";
import { createMockEventingInstallationContext } from "#test/fixtures/eventing";

const RE_FAIL_CONFIGURE_EVENTING =
  /^Failed to configure Adobe Commerce eventing:/;

const config = {
  enabled: true,
  environment_id: "project",
  instance_id: "instance",
  merchant_id: "org",
  workspace_configuration: "{}",
};

describe("configureCommerceEventing", () => {
  test("skips configuration when Commerce Eventing is already configured", async () => {
    const context = createMockEventingInstallationContext();

    await configureCommerceEventing(
      { config, context },
      {
        isDefaultProviderConfigured: true,
        isDefaultWorkspaceConfigurationEmpty: false,
      },
    );

    expect(
      context.commerceEventsClient.updateEventingConfiguration,
    ).not.toHaveBeenCalled();
  });

  test("rethrows and logs when updating Commerce Eventing configuration returns an unsuccessful response", async () => {
    const context = createMockEventingInstallationContext();
    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(false);

    await expect(
      configureCommerceEventing(
        { config, context },
        {
          isDefaultProviderConfigured: false,
          isDefaultWorkspaceConfigurationEmpty: false,
        },
      ),
    ).rejects.toThrow(RE_FAIL_CONFIGURE_EVENTING);

    expect(context.logger.error).toHaveBeenCalledWith(expect.any(String));
  });
});

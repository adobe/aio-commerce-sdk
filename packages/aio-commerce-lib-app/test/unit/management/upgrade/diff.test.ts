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

import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
} from "#management/installation/events/utils";
import {
  configHasDestructiveChange,
  configHasUnsupportedChange,
  diffConfig,
  isEmptyPlan,
} from "#management/upgrade/diff";
import {
  configWithAdminUiSingleGrid,
  configWithBusinessConfig,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithDynamicListOptions,
  configWithExternalEventing,
  configWithWebhooks,
  createCommerceEventConfig,
  createConfigWithCommerceProviderKey,
  fullConfig,
  minimalValidConfig,
  mockMetadata,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ResourceChange } from "#management/upgrade/types";

/** Finds a change for a domain, asserting exactly one match exists. */
function findChange(
  changes: ResourceChange[],
  domain: ResourceChange["domain"],
) {
  const matches = changes.filter((c) => c.domain === domain);
  expect(matches).toHaveLength(1);
  return matches[0];
}

/** Finds a change for a domain by its identity, for domains with more than one resource. */
function findChangeByIdentity(
  changes: ResourceChange[],
  domain: ResourceChange["domain"],
  identity: string,
) {
  const match = changes.find(
    (c) => c.domain === domain && c.identity === identity,
  );
  expect(match).toBeDefined();
  return match as ResourceChange;
}

describe("diffConfig", () => {
  test("identical configs produce an empty (all-unchanged) plan", () => {
    const diff = diffConfig(fullConfig, fullConfig);

    expect(isEmptyPlan(diff)).toBe(true);
    expect(configHasDestructiveChange(diff)).toBe(false);
    expect(configHasUnsupportedChange(diff)).toBe(false);
    expect(diff.changes.every((c) => c.kind === "unchanged")).toBe(true);
  });

  describe("commerceWebhook", () => {
    test("added webhook is a non-destructive, supported 'added' change with the immutable webhook key as identity", () => {
      const diff = diffConfig(minimalValidConfig, configWithWebhooks);

      const change = findChange(diff.changes, "commerceWebhook");
      const { webhook } = configWithWebhooks.webhooks[0];
      expect(change).toMatchObject({
        destructive: false,
        identity: `${webhook.webhook_method}:${webhook.webhook_type}:${webhook.batch_name}:${webhook.hook_name}`,
        kind: "added",
        supported: true,
      });
      expect(isEmptyPlan(diff)).toBe(false);
    });

    test("removed webhook is NOT destructive (stateless)", () => {
      const diff = diffConfig(configWithWebhooks, minimalValidConfig);

      const change = findChange(diff.changes, "commerceWebhook");
      expect(change).toMatchObject({ destructive: false, kind: "removed" });
      expect(configHasDestructiveChange(diff)).toBe(false);
    });

    test("changed webhook (same identity, different description) is marked unsupported (no in-place PUT until Commerce §7.2)", () => {
      const changedConfig = {
        ...configWithWebhooks,
        webhooks: [
          {
            ...configWithWebhooks.webhooks[0],
            description: "Updated description for order created webhook",
          },
        ],
      } satisfies CommerceAppConfigOutputModel;

      const diff = diffConfig(configWithWebhooks, changedConfig);

      const change = findChange(diff.changes, "commerceWebhook");
      expect(change).toMatchObject({
        destructive: false,
        kind: "changed",
        supported: false,
      });
      expect(configHasUnsupportedChange(diff)).toBe(true);
      expect(configHasDestructiveChange(diff)).toBe(false);
    });
  });

  describe("commerceSubscription", () => {
    test("removed commerce subscription IS destructive, identified by the namespaced event name", () => {
      const oldC = createCommerceEventConfig("plugin.order_created");
      const diff = diffConfig(
        oldC as CommerceAppConfigOutputModel,
        minimalValidConfig,
      );

      const change = findChange(diff.changes, "commerceSubscription");
      expect(change).toMatchObject({
        destructive: true,
        identity: getNamespacedEvent(mockMetadata, "plugin.order_created"),
        kind: "removed",
      });
      expect(configHasDestructiveChange(diff)).toBe(true);
    });

    test("changed commerce subscription (different fields, same event name) is marked unsupported (no PUT endpoint yet)", () => {
      const oldC = createCommerceEventConfig("plugin.order_created", {
        fields: [{ name: "a" }],
      });
      const newC = createCommerceEventConfig("plugin.order_created", {
        fields: [{ name: "a" }, { name: "b" }],
      });

      const diff = diffConfig(
        oldC as CommerceAppConfigOutputModel,
        newC as CommerceAppConfigOutputModel,
      );

      const change = findChange(diff.changes, "commerceSubscription");
      expect(change).toMatchObject({ kind: "changed", supported: false });
      expect(configHasUnsupportedChange(diff)).toBe(true);
    });

    test("added commerce subscription is never destructive", () => {
      const diff = diffConfig(
        minimalValidConfig,
        createCommerceEventConfig(
          "plugin.order_created",
        ) as CommerceAppConfigOutputModel,
      );

      const change = findChange(diff.changes, "commerceSubscription");
      expect(change).toMatchObject({ destructive: false, kind: "added" });
    });
  });

  describe("businessConfig", () => {
    test("removed businessConfig field is destructive, identified by field name", () => {
      const diff = diffConfig(configWithBusinessConfig, minimalValidConfig);

      const change = findChange(diff.changes, "businessConfig");
      expect(change).toMatchObject({
        destructive: true,
        identity: "testField",
        kind: "removed",
      });
      expect(configHasDestructiveChange(diff)).toBe(true);
    });

    test("changed businessConfig field (same name, different label) is supported and non-destructive", () => {
      const changedConfig = {
        ...configWithBusinessConfig,
        businessConfig: {
          schema: [
            {
              ...configWithBusinessConfig.businessConfig.schema[0],
              label: "Renamed Field",
            },
          ],
        },
      } satisfies CommerceAppConfigOutputModel;

      const diff = diffConfig(configWithBusinessConfig, changedConfig);

      const change = findChange(diff.changes, "businessConfig");
      expect(change).toMatchObject({
        destructive: false,
        kind: "changed",
        supported: true,
      });
    });

    test("changed dynamicList options factory (same field name, different function source) is detected as changed, not silently unchanged", () => {
      const changedConfig = {
        ...configWithDynamicListOptions,
        businessConfig: {
          schema: [
            {
              ...configWithDynamicListOptions.businessConfig.schema[0],
              options: () => [{ label: "PayPal", value: "paypal" }],
            },
          ],
        },
      } satisfies CommerceAppConfigOutputModel;

      const diff = diffConfig(configWithDynamicListOptions, changedConfig);

      const change = findChange(diff.changes, "businessConfig");
      expect(change).toMatchObject({
        destructive: false,
        kind: "changed",
        supported: true,
      });
      expect(isEmptyPlan(diff)).toBe(false);
    });

    test("identical dynamicList options factory (same source text, different function reference) is unchanged", () => {
      // Two independently-defined functions with the same source text, built via
      // separate calls, so this exercises source-based (not reference) equality.
      const buildConfig = (): CommerceAppConfigOutputModel => ({
        businessConfig: {
          schema: [
            {
              default: (opts: { value: string }[]) => opts[0].value,
              name: "paymentMethod",
              options: () => [{ label: "Braintree", value: "braintree" }],
              selectionMode: "single",
              type: "dynamicList",
            },
          ],
        },
        metadata: mockMetadata,
      });

      const diff = diffConfig(buildConfig(), buildConfig());

      const change = findChange(diff.changes, "businessConfig");
      expect(change.kind).toBe("unchanged");
      expect(isEmptyPlan(diff)).toBe(true);
    });
  });

  describe("adminUi", () => {
    test("added adminUi is non-destructive with the fixed 'adminUi' identity", () => {
      const diff = diffConfig(minimalValidConfig, configWithAdminUiSingleGrid);

      const change = findChange(diff.changes, "adminUi");
      expect(change).toMatchObject({
        destructive: false,
        identity: "adminUi",
        kind: "added",
      });
    });

    test("removed adminUi IS destructive", () => {
      const diff = diffConfig(configWithAdminUiSingleGrid, minimalValidConfig);

      const change = findChange(diff.changes, "adminUi");
      expect(change).toMatchObject({ destructive: true, kind: "removed" });
      expect(configHasDestructiveChange(diff)).toBe(true);
    });
  });

  describe("customStep", () => {
    test("added custom installation step is non-destructive, identified by step name", () => {
      const diff = diffConfig(
        minimalValidConfig,
        configWithCustomInstallationSteps,
      );

      const change = findChangeByIdentity(
        diff.changes,
        "customStep",
        "Demo Success",
      );
      expect(change).toMatchObject({ destructive: false, kind: "added" });
    });

    test("removed custom installation step is NOT destructive", () => {
      const diff = diffConfig(
        configWithCustomInstallationSteps,
        minimalValidConfig,
      );

      const change = findChangeByIdentity(
        diff.changes,
        "customStep",
        "Demo Success",
      );
      expect(change).toMatchObject({ destructive: false, kind: "removed" });
      expect(configHasDestructiveChange(diff)).toBe(false);
    });
  });

  describe("I/O Events (provider, registration, metadata)", () => {
    test("commerce eventing source adds a provider, registration, and metadata entry, all destructive on removal", () => {
      const diff = diffConfig(minimalValidConfig, configWithCommerceEventing);

      const providerKey = "order-events-provider";
      const runtimeAction = "my-package/handle-order";
      const eventCode = getIoEventCode(
        getNamespacedEvent(
          configWithCommerceEventing.metadata,
          "plugin.order_placed",
        ),
        COMMERCE_PROVIDER_TYPE,
      );

      const providerChange = findChange(diff.changes, "ioEventsProvider");
      expect(providerChange).toMatchObject({
        destructive: false,
        identity: providerKey,
        kind: "added",
      });

      const registrationChange = findChange(
        diff.changes,
        "ioEventsRegistration",
      );
      expect(registrationChange).toMatchObject({
        destructive: false,
        identity: `${providerKey}:${runtimeAction}`,
        kind: "added",
      });

      const metadataChange = findChange(diff.changes, "ioEventsMetadata");
      expect(metadataChange).toMatchObject({
        destructive: false,
        identity: `${providerKey}:${eventCode}`,
        kind: "added",
      });

      // Now removing them all must be flagged destructive (drops event history).
      const removalDiff = diffConfig(
        configWithCommerceEventing,
        minimalValidConfig,
      );

      expect(findChange(removalDiff.changes, "ioEventsProvider")).toMatchObject(
        { destructive: true, kind: "removed" },
      );
      expect(
        findChange(removalDiff.changes, "ioEventsRegistration"),
      ).toMatchObject({ destructive: true, kind: "removed" });
      expect(findChange(removalDiff.changes, "ioEventsMetadata")).toMatchObject(
        { destructive: true, kind: "removed" },
      );
      expect(configHasDestructiveChange(removalDiff)).toBe(true);
    });

    test("external eventing source uses the plain (unprefixed) event code for I/O Events metadata identity", () => {
      const diff = diffConfig(minimalValidConfig, configWithExternalEventing);

      const providerKey = "third-party-events-provider";
      const eventCode = getIoEventCode(
        getNamespacedEvent(
          configWithExternalEventing.metadata,
          "external_event",
        ),
        EXTERNAL_PROVIDER_TYPE,
      );

      // External events are not prefixed with "com.adobe.commerce.", unlike Commerce events.
      expect(eventCode).toBe(
        getNamespacedEvent(
          configWithExternalEventing.metadata,
          "external_event",
        ),
      );

      const metadataChange = findChange(diff.changes, "ioEventsMetadata");
      expect(metadataChange).toMatchObject({
        identity: `${providerKey}:${eventCode}`,
        kind: "added",
      });
    });

    test("explicit provider key wins over the slugified label for ioEventsProvider identity", () => {
      const diff = diffConfig(
        minimalValidConfig,
        createConfigWithCommerceProviderKey("custom-provider-key"),
      );

      const providerChange = findChange(diff.changes, "ioEventsProvider");
      expect(providerChange.identity).toBe("custom-provider-key");
    });

    test("changed I/O Events metadata (label change, same event) is supported and non-destructive", () => {
      const oldC = createCommerceEventConfig("plugin.order_created", {
        label: "Original Label",
      });
      const newC = createCommerceEventConfig("plugin.order_created", {
        label: "Updated Label",
      });

      const diff = diffConfig(
        oldC as CommerceAppConfigOutputModel,
        newC as CommerceAppConfigOutputModel,
      );

      const metadataChange = findChange(diff.changes, "ioEventsMetadata");
      expect(metadataChange).toMatchObject({
        destructive: false,
        kind: "changed",
        supported: true,
      });
    });
  });
});

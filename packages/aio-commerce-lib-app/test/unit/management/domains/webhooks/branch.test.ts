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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { isBranchStep, isLeafStep } from "#management/common/workflow/step";
import { webhooksStep } from "#management/domains/webhooks/branch";
import { createWebhooksStepContext } from "#management/domains/webhooks/context";
import { configWithWebhooks, minimalValidConfig } from "#test/fixtures/config";

describe("webhooks installation module", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("webhooksStep branch step", () => {
    test("should be a branch step with correct name and meta", () => {
      expect(isBranchStep(webhooksStep)).toBe(true);
      expect(webhooksStep.name).toBe("webhooks");
      expect(webhooksStep.meta).toEqual({
        install: {
          description: "Sets up Commerce webhooks",
          label: "Webhooks",
        },
        uninstall: {
          description: "Removes Commerce webhooks",
          label: "Webhooks",
        },
        upgrade: {
          description: "Reconciles Commerce webhooks",
          label: "Webhooks",
        },
      });
    });

    test("should only run if webhooks is defined", () => {
      expect.assert(webhooksStep.isConfigured);
      expect(webhooksStep.isConfigured(configWithWebhooks)).toBe(true);
      expect(webhooksStep.isConfigured(minimalValidConfig)).toBe(false);
    });

    test("should have subscriptions leaf step", () => {
      expect(webhooksStep.children).toHaveLength(1);
      expect(isLeafStep(webhooksStep.children[0])).toBe(true);
      expect(webhooksStep.children[0].name).toBe("subscriptions");
    });

    test("should have context factory function", () => {
      expect(webhooksStep.context).toBe(createWebhooksStepContext);
    });
  });

  describe("subscriptionsStep leaf step", () => {
    const [subscriptionsStep] = webhooksStep.children;

    test("should be a leaf step with name and meta", () => {
      expect(isLeafStep(subscriptionsStep)).toBe(true);
      expect(subscriptionsStep.name).toBe("subscriptions");
      expect(subscriptionsStep.meta).toEqual({
        install: {
          description: "Creates webhook subscriptions in Adobe Commerce",
          label: "Create Subscriptions",
        },
        uninstall: {
          description: "Deletes webhook subscriptions from Adobe Commerce",
          label: "Delete Subscriptions",
        },
        upgrade: {
          description: "Reconciles webhook subscriptions in Adobe Commerce",
          label: "Upgrade Subscriptions",
        },
      });
    });
  });
});

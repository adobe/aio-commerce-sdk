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

import { describe, expectTypeOf, test } from "vitest";

import { defineLeafStep } from "#management/common/workflow/step";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  LeafStep,
  ValidationExecutionContext,
} from "#management/common/workflow/step";
import type { WorkflowError } from "#management/common/workflow/types";
import type {
  CleanupIdentityOf,
  CleanupResource,
  UpgradeDomainPlan,
  UpgradeExecutionContext,
  UpgradeExecutionResult,
  UpgradeIssue,
  UpgradeOperation,
  UpgradePlanningInput,
  UpgradePlanningResult,
} from "#management/common/workflow/upgrade";
import type { StoredUpgradeAttempt } from "#management/upgrade/types";

// Domain-specific stand-ins the shared surface intentionally does not know about.
// The real webhook types live in their domain package; the point here is only to
// prove the generics compose, so local shapes are enough.
type WebhookEntry = {
  name: string;
  url: string;
  events: string[];
};

type WebhookIdentity = {
  webhookName: string;
};

type WebhookPlan = UpgradeDomainPlan<Partial<WebhookEntry>, WebhookIdentity>;

type WebhookUpgradeStep = LeafStep<
  "webhooks",
  CommerceAppConfigOutputModel,
  { webhookClient: { apply: () => void } },
  void,
  WebhookPlan,
  { webhooks: WebhookEntry[] }
>;

describe("upgrade type surface", () => {
  test("CleanupIdentityOf infers the plan's cleanup identity", () => {
    expectTypeOf<
      CleanupIdentityOf<WebhookPlan>
    >().toEqualTypeOf<WebhookIdentity>();
  });

  test("UpgradeOperation discriminates on kind", () => {
    const add: UpgradeOperation<Partial<WebhookEntry>> = {
      after: { name: "orders" },
      id: "op-1",
      kind: "add",
      label: "Add order webhook",
    };
    expectTypeOf(add).toMatchTypeOf<UpgradeOperation<Partial<WebhookEntry>>>();

    // "update" carries both before and after.
    const update: UpgradeOperation<Partial<WebhookEntry>> = {
      after: { name: "orders", url: "https://example.test" },
      before: { name: "orders" },
      id: "op-2",
      kind: "update",
      label: "Update order webhook",
    };
    expectTypeOf(update).toMatchTypeOf<
      UpgradeOperation<Partial<WebhookEntry>>
    >();

    const invalid: UpgradeOperation<Partial<WebhookEntry>> = {
      after: { name: "orders" },
      // @ts-expect-error - "add" operations do not carry a `before` value.
      before: { name: "orders" },
      id: "op-3",
      kind: "add",
      label: "Invalid",
    };
    expectTypeOf(invalid).toBeObject();
  });

  test("LeafStep threads the domain generics through the optional capability", () => {
    expectTypeOf<WebhookUpgradeStep>().toMatchTypeOf<{ type: "leaf" }>();

    // The upgrade handlers are optional members of a leaf step.
    type PlanUpgrade = NonNullable<WebhookUpgradeStep["planUpgrade"]>;
    type Upgrade = NonNullable<WebhookUpgradeStep["upgrade"]>;

    // planUpgrade receives the specialized planning input and returns a
    // discriminated plan-or-issues result.
    expectTypeOf<PlanUpgrade>()
      .parameter(0)
      .toEqualTypeOf<
        UpgradePlanningInput<
          CommerceAppConfigOutputModel,
          { webhooks: WebhookEntry[] },
          WebhookIdentity
        >
      >();
    expectTypeOf<PlanUpgrade>().returns.resolves.toEqualTypeOf<
      UpgradePlanningResult<WebhookPlan>
    >();

    // planUpgrade runs under the side-effect-free validation context (no customScripts).
    expectTypeOf<PlanUpgrade>()
      .parameter(1)
      .toEqualTypeOf<
        ValidationExecutionContext<{ webhookClient: { apply: () => void } }>
      >();

    // upgrade receives the specialized plan under the attempt-scoped context and
    // returns the specialized result.
    expectTypeOf<Upgrade>().parameter(0).toEqualTypeOf<WebhookPlan>();
    expectTypeOf<Upgrade>()
      .parameter(1)
      .toEqualTypeOf<
        UpgradeExecutionContext<{ webhookClient: { apply: () => void } }>
      >();
    expectTypeOf<Upgrade>().returns.resolves.toEqualTypeOf<
      UpgradeExecutionResult<{ webhooks: WebhookEntry[] }, WebhookIdentity>
    >();
  });

  test("CleanupResource carries the domain-specific identity", () => {
    expectTypeOf<
      CleanupResource<WebhookIdentity>["identity"]
    >().toEqualTypeOf<WebhookIdentity>();
  });

  test("StoredUpgradeAttempt.failure reuses the engine WorkflowError", () => {
    expectTypeOf<StoredUpgradeAttempt["failure"]>().toEqualTypeOf<
      WorkflowError<{ operationId?: string }> | undefined
    >();
  });

  test("UpgradePlanningResult discriminates on kind", () => {
    type Result = UpgradePlanningResult<WebhookPlan>;
    expectTypeOf<
      Extract<Result, { kind: "planned" }>["plan"]
    >().toEqualTypeOf<WebhookPlan>();
    expectTypeOf<
      Extract<Result, { kind: "blocked" }>["issues"]
    >().toEqualTypeOf<UpgradeIssue[]>();
  });

  test("defineLeafStep infers the upgrade generics from the handlers", () => {
    const step = defineLeafStep({
      install: (_config: CommerceAppConfigOutputModel) => undefined,
      meta: { install: { label: "Demo" } },
      name: "demo",
      planUpgrade: (
        _input: UpgradePlanningInput<
          CommerceAppConfigOutputModel,
          { webhooks: WebhookEntry[] },
          WebhookIdentity
        >,
        _context: ValidationExecutionContext,
      ): Promise<UpgradePlanningResult<WebhookPlan>> =>
        Promise.resolve({
          kind: "planned",
          plan: {
            domain: "demo",
            operations: [],
            possibleCleanupResources: [],
          },
        }),
      upgrade: (
        _plan: WebhookPlan,
        _context: UpgradeExecutionContext,
      ): Promise<
        UpgradeExecutionResult<{ webhooks: WebhookEntry[] }, WebhookIdentity>
      > =>
        Promise.resolve({ resolvedCleanupResources: [], snapshotData: null }),
    });

    expectTypeOf<NonNullable<typeof step.upgrade>>()
      .parameter(0)
      .toEqualTypeOf<WebhookPlan>();
    expectTypeOf<
      NonNullable<typeof step.planUpgrade>
    >().returns.resolves.toEqualTypeOf<UpgradePlanningResult<WebhookPlan>>();
  });
});

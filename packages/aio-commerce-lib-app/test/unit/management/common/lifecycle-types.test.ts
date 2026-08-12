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
  LifecycleAttempt,
  LifecycleOperation,
  SuccessfulResult,
} from "#management/common/orchestration";
import type {
  ApplyContext,
  ApplyResult,
  CleanupIdentityOf,
  CleanupResource,
  DomainPlan,
  PlanningInput,
  PlanningIssue,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type {
  LeafStep,
  ValidationExecutionContext,
} from "#management/common/workflow/step";
import type { WorkflowError } from "#management/common/workflow/types";

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

type WebhookPlan = DomainPlan<Partial<WebhookEntry>, WebhookIdentity>;
type WebhookMigrationPlan = DomainPlan<
  Partial<WebhookEntry>,
  WebhookIdentity,
  WebhookEntry
>;

type WebhookLeafStep = LeafStep<
  "webhooks",
  CommerceAppConfigOutputModel,
  { webhookClient: { apply: () => void } },
  void,
  WebhookPlan,
  { webhooks: WebhookEntry[] }
>;

describe("lifecycle type surface", () => {
  test("CleanupIdentityOf infers the plan's cleanup identity", () => {
    expectTypeOf<
      CleanupIdentityOf<WebhookPlan>
    >().toEqualTypeOf<WebhookIdentity>();
  });

  test("DomainPlan supports distinct before and after values", () => {
    expectTypeOf<WebhookMigrationPlan["operations"]>().toEqualTypeOf<
      ResourceOperation<Partial<WebhookEntry>, WebhookEntry>[]
    >();
    expectTypeOf<
      CleanupIdentityOf<WebhookMigrationPlan>
    >().toEqualTypeOf<WebhookIdentity>();
  });

  test("ResourceOperation discriminates on kind", () => {
    const add: ResourceOperation<Partial<WebhookEntry>> = {
      after: { name: "orders" },
      category: "configuration",
      id: "op-1",
      kind: "add",
      label: "Add order webhook",
    };
    expectTypeOf(add).toMatchTypeOf<ResourceOperation<Partial<WebhookEntry>>>();

    // "update" carries both before and after.
    const update: ResourceOperation<Partial<WebhookEntry>> = {
      after: { name: "orders", url: "https://example.test" },
      before: { name: "orders" },
      category: "configuration",
      id: "op-2",
      kind: "update",
      label: "Update order webhook",
    };
    expectTypeOf(update).toMatchTypeOf<
      ResourceOperation<Partial<WebhookEntry>>
    >();

    const invalid: ResourceOperation<Partial<WebhookEntry>> = {
      after: { name: "orders" },
      // @ts-expect-error - "add" operations do not carry a `before` value.
      before: { name: "orders" },
      category: "configuration",
      id: "op-3",
      kind: "add",
      label: "Invalid",
    };
    expectTypeOf(invalid).toBeObject();
  });

  test("LeafStep threads the domain generics through the optional capability", () => {
    expectTypeOf<WebhookLeafStep>().toMatchTypeOf<{ type: "leaf" }>();

    // The resource-capability handlers are optional members of a leaf step.
    type Plan = NonNullable<WebhookLeafStep["plan"]>;
    type Apply = NonNullable<WebhookLeafStep["apply"]>;

    // plan receives the specialized planning input and returns a discriminated
    // plan-or-issues result.
    expectTypeOf<Plan>()
      .parameter(0)
      .toEqualTypeOf<
        PlanningInput<
          CommerceAppConfigOutputModel,
          { webhooks: WebhookEntry[] },
          WebhookIdentity
        >
      >();
    expectTypeOf<Plan>().returns.resolves.toEqualTypeOf<
      PlanningResult<WebhookPlan>
    >();

    // plan runs under the side-effect-free validation context (no customScripts).
    expectTypeOf<Plan>()
      .parameter(1)
      .toEqualTypeOf<
        ValidationExecutionContext<{ webhookClient: { apply: () => void } }>
      >();

    // apply receives the specialized plan under the attempt-scoped context and
    // returns the specialized result.
    expectTypeOf<Apply>().parameter(0).toEqualTypeOf<WebhookPlan>();
    expectTypeOf<Apply>()
      .parameter(1)
      .toEqualTypeOf<ApplyContext<{ webhookClient: { apply: () => void } }>>();
    expectTypeOf<Apply>().returns.resolves.toEqualTypeOf<
      ApplyResult<{ webhooks: WebhookEntry[] }, WebhookIdentity>
    >();
  });

  test("CleanupResource carries the domain-specific identity", () => {
    expectTypeOf<
      CleanupResource<WebhookIdentity>["identity"]
    >().toEqualTypeOf<WebhookIdentity>();
  });

  test("LifecycleAttempt discriminates result and failure on status", () => {
    // A succeeded attempt carries its result; a failed attempt carries its
    // failure (reusing the engine WorkflowError). Neither leaks onto the other.
    expectTypeOf<
      Extract<LifecycleAttempt, { status: "succeeded" }>["result"]
    >().toEqualTypeOf<SuccessfulResult>();
    expectTypeOf<
      Extract<LifecycleAttempt, { status: "failed" }>["failure"]
    >().toEqualTypeOf<WorkflowError<{ operationId?: string }>>();
  });

  test("LifecycleAttempt records the lifecycle operation", () => {
    expectTypeOf<
      LifecycleAttempt["operation"]
    >().toEqualTypeOf<LifecycleOperation>();
  });

  test("PlanningResult discriminates on kind", () => {
    type Result = PlanningResult<WebhookPlan>;
    expectTypeOf<
      Extract<Result, { kind: "planned" }>["plan"]
    >().toEqualTypeOf<WebhookPlan>();
    expectTypeOf<
      Extract<Result, { kind: "blocked" }>["issues"]
    >().toEqualTypeOf<PlanningIssue[]>();
  });

  test("defineLeafStep infers the resource generics from the handlers", () => {
    const step = defineLeafStep({
      apply: (
        _plan: WebhookPlan,
        _context: ApplyContext,
      ): Promise<ApplyResult<{ webhooks: WebhookEntry[] }, WebhookIdentity>> =>
        Promise.resolve({ resolvedCleanupResources: [], snapshotData: null }),
      install: (_config: CommerceAppConfigOutputModel) => undefined,
      meta: { install: { label: "Demo" } },
      name: "demo",
      plan: (
        input: PlanningInput<
          CommerceAppConfigOutputModel,
          { webhooks: WebhookEntry[] },
          WebhookIdentity
        >,
        _context: ValidationExecutionContext,
      ): Promise<PlanningResult<WebhookPlan>> =>
        Promise.resolve({
          kind: "planned",
          plan: {
            operations: [],
            path: input.path,
            possibleCleanupResources: [],
          },
        }),
    });

    expectTypeOf<NonNullable<typeof step.apply>>()
      .parameter(0)
      .toEqualTypeOf<WebhookPlan>();
    expectTypeOf<
      NonNullable<typeof step.plan>
    >().returns.resolves.toEqualTypeOf<PlanningResult<WebhookPlan>>();
  });
});

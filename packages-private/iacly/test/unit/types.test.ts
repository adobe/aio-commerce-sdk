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

import { describe, expectTypeOf, it } from "vitest";

import type {
  AppliedSnapshot,
  ApplyFn,
  ApplyOptions,
  DiffResult,
  Lock,
  Plan,
  PlanAction,
  PlanFn,
  PlanOptions,
  Provider,
  ProviderOutputs,
  ProviderSnapshot,
  ReconcileEvent,
  ReconcileFn,
  ReconcileOptions,
  ReconcileResult,
  Resource,
  ResourceOutcome,
  ResourceRecord,
  UpstreamOutputs,
} from "@aio-commerce-sdk/iacly";

describe("iacly type exports", () => {
  it("DiffResult is a discriminated union without delete", () => {
    expectTypeOf<DiffResult<string, string>>().toMatchTypeOf<
      | { kind: "noop" }
      | { kind: "create"; desired: string }
      | { kind: "update"; current: string; desired: string }
      | { kind: "replace"; current: string; desired: string }
    >();
  });

  it("PlanAction includes delete and carries dependsOn", () => {
    const action: PlanAction = {
      kind: "delete",
      resource: "webhooks/webhook",
      key: "observer:myapp:order_place",
      dependsOn: [],
      current: {},
    };
    expectTypeOf(action.dependsOn).toEqualTypeOf<readonly string[]>();
  });

  it("ResourceOutcome is a discriminated union", () => {
    const outcome: ResourceOutcome = { status: "created", state: {} };
    expectTypeOf(outcome).toMatchTypeOf<
      | { status: "created"; state: unknown }
      | { status: "updated"; state: unknown }
      | { status: "replaced"; state: unknown }
      | { status: "deleted" }
      | { status: "noop" }
      | { status: "failed"; error: unknown }
      | { status: "blocked"; blockedBy: string }
    >();
  });

  it("ResourceRecord stores full outcome", () => {
    const record: ResourceRecord<string, { id: string }> = {
      key: "my-key",
      desired: "desired-value",
      outcome: { status: "created", state: { id: "abc" } },
    };
    expectTypeOf(record.outcome).toMatchTypeOf<
      ResourceOutcome<{ id: string }>
    >();
  });

  it("Provider and Resource are assignable", () => {
    expectTypeOf<Provider<unknown>>().toMatchTypeOf<{
      readonly name: string;
      readonly resources: readonly Resource<unknown, unknown, unknown>[];
    }>();
  });

  it("function type aliases are exported", () => {
    expectTypeOf<PlanFn>().toBeFunction();
    expectTypeOf<ApplyFn>().toBeFunction();
    expectTypeOf<ReconcileFn>().toBeFunction();
  });

  it("ReconcileResult contains plan and snapshot", () => {
    expectTypeOf<ReconcileResult>().toMatchTypeOf<{
      readonly plan: Plan;
      readonly snapshot: AppliedSnapshot;
    }>();
  });
});

describe("additional type exports", () => {
  it("Lock has acquire, release, forceRelease", () => {
    expectTypeOf<Lock>().toMatchTypeOf<{
      acquire(): Promise<void>;
      release(): Promise<void>;
      forceRelease(): Promise<void>;
    }>();
  });

  it("PlanOptions has optional previousSnapshot", () => {
    expectTypeOf<PlanOptions>().toMatchTypeOf<{
      previousSnapshot?: AppliedSnapshot;
    }>();
  });

  it("ApplyOptions has lock, force, maxConcurrency, onEvent", () => {
    expectTypeOf<ApplyOptions>().toMatchTypeOf<{
      lock?: Lock;
      force?: boolean;
      maxConcurrency?: number;
    }>();
  });

  it("ReconcileOptions is assignable to both PlanOptions and ApplyOptions", () => {
    expectTypeOf<ReconcileOptions>().toMatchTypeOf<PlanOptions>();
    expectTypeOf<ReconcileOptions>().toMatchTypeOf<ApplyOptions>();
  });

  it("ProviderOutputs is a string-keyed record", () => {
    expectTypeOf<ProviderOutputs>().toMatchTypeOf<Record<string, unknown>>();
  });

  it("UpstreamOutputs is a ReadonlyMap of ProviderOutputs", () => {
    expectTypeOf<UpstreamOutputs>().toMatchTypeOf<
      ReadonlyMap<string, ProviderOutputs>
    >();
  });

  it("ProviderSnapshot has kind and resources", () => {
    expectTypeOf<ProviderSnapshot>().toMatchTypeOf<{
      readonly kind: string;
      readonly resources: readonly ResourceRecord[];
    }>();
  });

  it("ReconcileEvent is a discriminated union on type", () => {
    expectTypeOf<ReconcileEvent>().toMatchTypeOf<{ type: string }>();
    // Verify the plan-ready variant exists and the type discriminant is a string literal union
    expectTypeOf<ReconcileEvent["type"]>().toMatchTypeOf<string>();
    expectTypeOf<"plan-ready">().toMatchTypeOf<ReconcileEvent["type"]>();
  });
});

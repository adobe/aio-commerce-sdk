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
  DiffResult,
  Plan,
  PlanAction,
  PlanFn,
  Provider,
  ReconcileFn,
  ReconcileResult,
  Resource,
  ResourceOutcome,
  ResourceRecord,
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

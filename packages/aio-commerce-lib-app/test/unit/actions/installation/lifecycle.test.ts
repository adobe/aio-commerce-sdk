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
  attemptInProgressConflict,
  toAttemptStatus,
} from "#actions/installation/lifecycle";
import { toPlanPreview } from "#actions/installation/plan-preview";
import {
  createMockLifecycleAttempt,
  createMockLifecyclePlan,
} from "#test/fixtures/lifecycle";

import type { LifecyclePlan } from "#management/common/orchestration";
import type { ItemRef } from "#management/common/workflow/resource";

const SECRET = "super-secret-value";

function createPlan(overrides?: Partial<LifecyclePlan>) {
  return createMockLifecyclePlan({
    domains: [
      {
        operations: [
          {
            after: { token: SECRET },
            id: "add-event",
            itemRefs: [
              {
                config: { label: "Order placed" } as ItemRef["config"],
                key: "ev-1",
              },
            ],
            kind: "add",
            label: "Add event",
            reason: "change",
          },
        ],
        path: ["root", "eventing", "commerce"],
      },
      { operations: [], path: ["root", "eventing", "external"] },
    ],
    id: "plan-7",
    issues: [
      {
        blocking: false,
        code: "WARN",
        details: { secret: SECRET },
        domain: "eventing",
        message: "Heads up",
      },
    ],
    previousPlanId: "plan-6",
    ...overrides,
  });
}

describe("toPlanPreview", () => {
  test("lists the versions, the domains with operations and the issues", () => {
    expect(toPlanPreview(createPlan())).toEqual({
      domains: [
        {
          changes: [],
          operations: [
            {
              id: "add-event",
              itemRefs: [
                {
                  config: { label: "Order placed" },
                  key: "ev-1",
                },
              ],
              kind: "add",
              label: "Add event",
              reason: "change",
            },
          ],
          path: ["root", "eventing", "commerce"],
        },
      ],
      id: "plan-7",
      issues: [
        {
          blocking: false,
          code: "WARN",
          domain: "eventing",
          message: "Heads up",
          path: undefined,
          severity: "error",
        },
      ],
      operation: "upgrade",
      sourceVersion: "1.0.0",
      targetVersion: "2.0.0",
    });
  });

  test("keeps a domain with changes and no operations, and lists its changes", () => {
    const changes = [
      {
        itemRef: {
          config: { label: "Order placed" } as ItemRef["config"],
          key: "ev-1",
        },
        key: "ev-1",
        kind: "update" as const,
      },
    ];
    const preview = toPlanPreview(
      createPlan({
        domains: [
          { changes, operations: [], path: ["root", "eventing", "commerce"] },
          { changes: [], operations: [], path: ["root", "webhooks"] },
          { operations: [], path: ["root", "admin-ui"] },
        ],
      }),
    );

    expect(preview.domains).toEqual([
      { changes, operations: [], path: ["root", "eventing", "commerce"] },
    ]);
  });

  test("defaults the changes of a stored domain that has none to an empty list", () => {
    const [domain] = toPlanPreview(createPlan()).domains;

    expect(domain?.changes).toEqual([]);
  });

  test("lists the changes of a domain with operations", () => {
    const changes = [
      { itemRef: { key: "ev-1" }, key: "ev-1", kind: "add" as const },
    ];
    const [domain] = toPlanPreview(
      createPlan({
        domains: [
          {
            changes,
            operations: [
              {
                after: {},
                id: "a",
                itemRefs: [],
                kind: "add",
                label: "A",
                reason: "change",
              },
            ],
            path: ["root", "webhooks"],
          },
        ],
      }),
    ).domains;

    expect(domain?.changes).toEqual(changes);
    expect(domain?.operations).toHaveLength(1);
  });

  test("uses null versions when there is no source or target", () => {
    const preview = toPlanPreview(createPlan({ source: null, target: null }));

    expect(preview.sourceVersion).toBeNull();
    expect(preview.targetVersion).toBeNull();
  });
});

describe("toAttemptStatus", () => {
  test.each(["pending", "in-progress", "succeeded", "failed"] as const)(
    "carries the plan preview of a %s attempt",
    (status) => {
      const plan = createPlan();
      const body = toAttemptStatus(
        createMockLifecycleAttempt({ plan, status }),
      );

      expect(body.plan).toEqual(toPlanPreview(plan));
      expect(body.planId).toBe("plan-7");
      expect(body.previousPlanId).toBe("plan-6");
    },
  );

  test("never carries the raw plan or its payloads", () => {
    const body = toAttemptStatus(
      createMockLifecycleAttempt({ plan: createPlan(), status: "in-progress" }),
    );

    expect(JSON.stringify(body.plan)).not.toContain(SECRET);
    expect(body.plan).not.toHaveProperty("target");
    expect(body.plan).not.toHaveProperty("source");
  });
});

describe("attemptInProgressConflict", () => {
  test("carries the plan preview of the attempt in progress", () => {
    const plan = createPlan();
    const response = attemptInProgressConflict(
      createMockLifecycleAttempt({ plan, status: "in-progress" }),
    );

    expect(response).toMatchObject({
      error: {
        body: {
          attempt: { plan: toPlanPreview(plan), planId: "plan-7" },
          code: "in-progress",
        },
        statusCode: 409,
      },
    });
  });

  test("has no attempt when none is in progress", () => {
    expect(attemptInProgressConflict(null)).not.toHaveProperty(
      "error.body.attempt",
    );
  });
});

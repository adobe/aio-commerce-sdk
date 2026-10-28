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

import { planEventChanges } from "#management/domains/events/changes";
import {
  createMockAppEvent,
  createMockCommerceEventsConfig,
  createMockExternalEventsConfig,
  createMockProvider,
} from "#test/fixtures/eventing";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";

const APP_ID = "testapp";

const A = "observer.a";
const B = "observer.b";

type Source = {
  provider?: ReturnType<typeof createMockProvider>;
  events: ReturnType<typeof createMockAppEvent>[];
};

function commerce(...sources: Source[]) {
  return createMockCommerceEventsConfig(
    sources.map(({ provider, events }) => ({
      events,
      provider: provider ?? createMockProvider("Provider", "p"),
    })),
  );
}

function event(name: string, action = "pkg/action", extra = {}) {
  return { ...createMockAppEvent(name, [action]), ...extra };
}

function plan(
  baseline: ReturnType<typeof commerce> | null,
  target: ReturnType<typeof commerce> | null,
  env: CommerceEnv = "paas",
) {
  return planEventChanges(
    baseline,
    target,
    "dx_commerce_events",
    env,
    APP_ID,
  ).map(({ kind, key }) => [kind, key]);
}

const keyOf = (name: string) => `p:${APP_ID}.${name}`;

describe("planEventChanges", () => {
  test.each([
    {
      baseline: null,
      expected: [["add", keyOf(A)]],
      name: "adds every event without a baseline",
      target: commerce({ events: [event(A)] }),
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [["remove", keyOf(A)]],
      name: "removes every event without a target",
      target: null,
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [],
      name: "ignores an unchanged event",
      target: commerce({ events: [event(A)] }),
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [["update", keyOf(A)]],
      name: "updates an event whose label changed",
      target: commerce({ events: [event(A, "pkg/action", { label: "New" })] }),
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [["update", keyOf(A)]],
      name: "updates an event whose subscription fields changed",
      target: commerce({
        events: [event(A, "pkg/action", { fields: [{ name: "id" }] })],
      }),
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [],
      name: "ignores an event that only changes its runtime action name",
      target: commerce({ events: [event(A, "pkg/action")] }),
    },
    {
      baseline: commerce({ events: [event(A), event(B)] }),
      expected: [
        ["update", keyOf(A)],
        ["update", keyOf(B)],
      ],
      name: "updates every event of a provider whose label changed",
      target: commerce({
        events: [event(A), event(B)],
        provider: createMockProvider("Renamed", "p"),
      }),
    },
    {
      baseline: commerce({ events: [event(A), event(B)] }),
      expected: [
        ["update", keyOf(A)],
        ["update", keyOf(B)],
      ],
      name: "updates the events of a registration whose members changed",
      target: commerce({ events: [event(A), event(B, "pkg/other")] }),
    },
    {
      baseline: commerce({ events: [event(A)] }),
      expected: [
        ["add", keyOf(B)],
        ["remove", keyOf(A)],
      ],
      name: "adds and removes by key",
      target: commerce({ events: [event(B)] }),
    },
    {
      baseline: null,
      expected: [],
      name: "has no change without either config",
      target: null,
    },
  ])("$name", ({ baseline, target, expected }) => {
    expect(plan(baseline, target)).toEqual(expected);
  });

  test("only counts the events that apply to the environment", () => {
    const target = commerce({
      events: [event(A, "pkg/action", { env: ["saas"] }), event(B)],
    });

    expect(plan(null, target, "paas")).toEqual([["add", keyOf(B)]]);
    expect(plan(null, target, "saas")).toEqual([
      ["add", keyOf(A)],
      ["add", keyOf(B)],
    ]);
  });

  test("selects the events of the leaf type", () => {
    const config = createMockExternalEventsConfig([
      {
        events: [createMockAppEvent("ext.one", ["pkg/action"])],
        provider: createMockProvider("Ext", "x"),
      },
    ]);

    expect(
      planEventChanges(null, config, "3rd_party_custom_events", "paas", APP_ID),
    ).toMatchObject([{ key: `x:${APP_ID}.ext.one`, kind: "add" }]);
    expect(
      planEventChanges(null, config, "dx_commerce_events", "paas", APP_ID),
    ).toEqual([]);
  });

  test("carries the target event as the item reference, the baseline one for a remove", () => {
    const base = event(A);
    const next = event(A, "pkg/action", { label: "New" });

    expect(
      planEventChanges(
        commerce({ events: [base] }),
        commerce({ events: [next] }),
        "dx_commerce_events",
        "paas",
        APP_ID,
      )[0]?.itemRef,
    ).toEqual({ config: next, key: keyOf(A) });
    expect(
      planEventChanges(
        commerce({ events: [base] }),
        null,
        "dx_commerce_events",
        "paas",
        APP_ID,
      )[0]?.itemRef,
    ).toEqual({ config: base, key: keyOf(A) });
  });
});

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
  groupOperationsIntoItems,
  toItemRef,
} from "#management/common/workflow/resource";

import type { ResourceOperation } from "#management/common/workflow/resource";

const event = { key: "orders:order_placed", kind: "event" };

const op = (
  id: string,
  overrides: Partial<ResourceOperation<unknown>> = {},
): ResourceOperation<unknown> =>
  ({
    after: {},
    id,
    kind: "add",
    label: id,
    reason: "change",
    ...overrides,
  }) as ResourceOperation<unknown>;

describe("toItemRef", () => {
  test("keeps the label and description of the source", () => {
    expect(toItemRef("event", "k", { description: "d", label: "l" })).toEqual({
      description: "d",
      key: "k",
      kind: "event",
      label: "l",
    });
  });

  test("leaves out what the source lacks, and an empty text", () => {
    expect(toItemRef("event", "k")).toEqual({ key: "k", kind: "event" });
    expect(toItemRef("event", "k", { description: "", label: "l" })).toEqual({
      key: "k",
      kind: "event",
      label: "l",
    });
  });
});

describe("groupOperationsIntoItems", () => {
  test("returns no items for no operations", () => {
    expect(groupOperationsIntoItems([])).toEqual([]);
  });

  test("leaves out operations without item references", () => {
    expect(groupOperationsIntoItems([op("add:a")])).toEqual([]);
  });

  test("groups by kind and key, in the order of the first operation of each item", () => {
    const provider = { key: "orders", kind: "provider" };
    const items = groupOperationsIntoItems([
      op("add:provider", { itemRefs: [provider], reason: "drift" }),
      op("add:metadata", {
        itemRefs: [
          { ...event, description: "Event text", label: "Order placed" },
        ],
      }),
      op("add:internal"),
      op("add:subscription", { itemRefs: [event], reason: "drift" }),
    ]);

    expect(items).toEqual([
      {
        change: "add",
        ...provider,
        operationIds: ["add:provider"],
        reason: "drift",
      },
      {
        change: "add",
        description: "Event text",
        ...event,
        label: "Order placed",
        operationIds: ["add:metadata", "add:subscription"],
        reason: "change",
      },
    ]);
  });

  test("puts an operation with several references into each of its items", () => {
    const other = { key: "orders:other", kind: "event" };
    const items = groupOperationsIntoItems([
      op("add:registration", { itemRefs: [event, other] }),
      op("add:metadata", { itemRefs: [event] }),
    ]);

    expect(items.map(({ key, operationIds }) => [key, operationIds])).toEqual([
      [event.key, ["add:registration", "add:metadata"]],
      [other.key, ["add:registration"]],
    ]);
  });

  test("is an add only when every operation adds, a remove only when every operation removes, else an update", () => {
    const remove = (id: string) =>
      op(id, { before: {}, itemRefs: [event], kind: "remove" } as never);
    const add = (id: string) => op(id, { itemRefs: [event] });

    expect(
      groupOperationsIntoItems([remove("r1"), remove("r2")])[0]?.change,
    ).toBe("remove");
    expect(groupOperationsIntoItems([remove("r"), add("a")])[0]?.change).toBe(
      "update",
    );
    expect(
      groupOperationsIntoItems([
        op("u", { itemRefs: [event], kind: "update" }),
      ])[0]?.change,
    ).toBe("update");
  });

  test("takes each of label and description from the first reference that has it", () => {
    const [item] = groupOperationsIntoItems([
      op("a", { itemRefs: [event] }),
      op("b", { itemRefs: [{ ...event, label: "Label" }] }),
      op("c", {
        itemRefs: [{ ...event, description: "Text", label: "Other" }],
      }),
    ]);

    expect(item).toMatchObject({ description: "Text", label: "Label" });
  });

  test("leaves label and description out when no reference has them", () => {
    const [item] = groupOperationsIntoItems([op("a", { itemRefs: [event] })]);

    expect(item).not.toHaveProperty("label");
    expect(item).not.toHaveProperty("description");
  });

  test("is a repair, reason drift, only when every operation is drift", () => {
    expect(
      groupOperationsIntoItems([
        op("a", { itemRefs: [event], reason: "drift" }),
        op("b", { itemRefs: [event], reason: "drift" }),
      ])[0]?.reason,
    ).toBe("drift");
  });
});

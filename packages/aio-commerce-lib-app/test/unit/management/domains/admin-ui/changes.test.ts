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

import { toAdminUiChanges } from "#management/domains/admin-ui/changes";
import {
  diffComponents,
  enumerateComponents,
} from "#management/domains/admin-ui/plan";

import type { AdminUi } from "#config/schema/admin-ui";

const menu = {
  id: "m",
  label: "Menu",
  sortOrder: 1,
} as unknown as AdminUi["menu"];
const acl = (id: string, label = id) => ({ id, label });

function changes(baseline: AdminUi | null, target: AdminUi | null) {
  return toAdminUiChanges(
    diffComponents(
      baseline ? enumerateComponents(baseline) : new Map(),
      target ? enumerateComponents(target) : new Map(),
    ),
  ).map(({ kind, key }) => [kind, key]);
}

describe("toAdminUiChanges", () => {
  test.each([
    {
      baseline: null,
      expected: [
        ["add", "menu"],
        ["add", "acl.one"],
      ],
      name: "adds every component without a baseline",
      target: { acl: [acl("one")], menu } as AdminUi,
    },
    {
      baseline: { acl: [acl("one")], menu } as AdminUi,
      expected: [
        ["remove", "menu"],
        ["remove", "acl.one"],
      ],
      name: "removes every component without a target",
      target: null,
    },
    {
      baseline: { acl: [acl("one")] } as AdminUi,
      expected: [],
      name: "ignores an unchanged ACL entry",
      target: { acl: [acl("one")] } as AdminUi,
    },
    {
      baseline: { acl: [acl("one")] } as AdminUi,
      expected: [["update", "acl.one"]],
      name: "updates a changed ACL entry",
      target: { acl: [acl("one", "Other")] } as AdminUi,
    },
    {
      baseline: { acl: [acl("one")] } as AdminUi,
      expected: [
        ["add", "acl.two"],
        ["remove", "acl.one"],
      ],
      name: "adds and removes by key",
      target: { acl: [acl("two")] } as AdminUi,
    },
    {
      baseline: null,
      expected: [],
      name: "has no change without either config",
      target: null,
    },
  ])("$name", ({ baseline, target, expected }) => {
    expect(changes(baseline, target)).toEqual(expected);
  });

  test("carries the item reference of the operation", () => {
    const [change] = toAdminUiChanges(
      diffComponents(
        new Map(),
        enumerateComponents({ acl: [acl("one")] } as AdminUi),
      ),
    );

    expect(change).toEqual({
      itemRef: { config: acl("one"), key: "acl.one" },
      key: "acl.one",
      kind: "add",
    });
  });
});

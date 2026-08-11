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
  configHasDestructiveChange,
  configHasUnsupportedChange,
  diffConfig,
  getChangesForDomain,
  getOperativeChanges,
  isEmptyPlan,
} from "#management/upgrade/diff";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { DomainCollector, DomainRule } from "#management/upgrade/types";

/** A test config carrying, per domain, a list of `{ id, value }` resources to diff. */
type TestConfig = Record<string, { id: string; value: unknown }[]>;

/** Builds a collector that reads a domain's resources from a {@link TestConfig}. */
function makeCollector(domain: string, rule: DomainRule): DomainCollector {
  return {
    collect: (config) =>
      new Map(
        ((config as unknown as TestConfig)[domain] ?? []).map(
          ({ id, value }) => [id, value],
        ),
      ),
    domain,
    rule,
  };
}

/** Casts a {@link TestConfig} to the config type the engine accepts (contents are collector-defined). */
function asConfig(config: TestConfig): CommerceAppConfigOutputModel {
  return config as unknown as CommerceAppConfigOutputModel;
}

const PERMISSIVE_RULE: DomainRule = {
  destructiveOnRemove: false,
  unsupportedOnChange: false,
};

describe("diffConfig / diffDomain", () => {
  test("emits added, removed, changed, and unchanged per identity", () => {
    const collector = makeCollector("d", PERMISSIVE_RULE);
    const oldConfig = asConfig({
      d: [
        { id: "keep", value: { x: 1 } },
        { id: "change", value: { x: 1 } },
        { id: "remove", value: { x: 1 } },
      ],
    });
    const newConfig = asConfig({
      d: [
        { id: "keep", value: { x: 1 } },
        { id: "change", value: { x: 2 } },
        { id: "add", value: { x: 1 } },
      ],
    });

    const { changes } = diffConfig(oldConfig, newConfig, [collector]);
    const byIdentity = Object.fromEntries(changes.map((c) => [c.identity, c]));

    expect(byIdentity.keep.kind).toBe("unchanged");
    expect(byIdentity.change.kind).toBe("changed");
    expect(byIdentity.change.before).toEqual({ x: 1 });
    expect(byIdentity.change.after).toEqual({ x: 2 });
    expect(byIdentity.remove.kind).toBe("removed");
    expect(byIdentity.remove.before).toEqual({ x: 1 });
    expect(byIdentity.remove.after).toBeUndefined();
    expect(byIdentity.add.kind).toBe("added");
    expect(byIdentity.add.after).toEqual({ x: 1 });
    expect(byIdentity.add.before).toBeUndefined();
  });

  test("treats key ordering as equal but a nested value change as changed", () => {
    const collector = makeCollector("d", PERMISSIVE_RULE);
    const oldConfig = asConfig({ d: [{ id: "a", value: { x: 1, y: 2 } }] });
    const reordered = asConfig({ d: [{ id: "a", value: { x: 1, y: 2 } }] });
    const mutated = asConfig({ d: [{ id: "a", value: { x: 1, y: 3 } }] });

    expect(diffConfig(oldConfig, reordered, [collector]).changes[0].kind).toBe(
      "unchanged",
    );
    expect(diffConfig(oldConfig, mutated, [collector]).changes[0].kind).toBe(
      "changed",
    );
  });

  test("detects a function-body change that JSON.stringify would drop", () => {
    const collector = makeCollector("d", PERMISSIVE_RULE);
    const oldConfig = asConfig({ d: [{ id: "a", value: { fn: () => 1 } }] });
    const sameBody = asConfig({ d: [{ id: "a", value: { fn: () => 1 } }] });
    const newBody = asConfig({ d: [{ id: "a", value: { fn: () => 2 } }] });

    expect(diffConfig(oldConfig, sameBody, [collector]).changes[0].kind).toBe(
      "unchanged",
    );
    expect(diffConfig(oldConfig, newBody, [collector]).changes[0].kind).toBe(
      "changed",
    );
  });

  test("stamps destructive only on removals of a destructive domain", () => {
    const collector = makeCollector("d", {
      destructiveOnRemove: true,
      unsupportedOnChange: false,
    });
    const oldConfig = asConfig({
      d: [
        { id: "remove", value: 1 },
        { id: "change", value: 1 },
      ],
    });
    const newConfig = asConfig({
      d: [
        { id: "change", value: 2 },
        { id: "add", value: 1 },
      ],
    });

    const byIdentity = Object.fromEntries(
      diffConfig(oldConfig, newConfig, [collector]).changes.map((c) => [
        c.identity,
        c,
      ]),
    );

    expect(byIdentity.remove.destructive).toBe(true);
    expect(byIdentity.change.destructive).toBe(false);
    expect(byIdentity.add.destructive).toBe(false);
  });

  test("marks a changed resource unsupported when the domain forbids in-place change", () => {
    const collector = makeCollector("d", {
      destructiveOnRemove: false,
      unsupportedOnChange: true,
    });
    const oldConfig = asConfig({
      d: [
        { id: "change", value: 1 },
        { id: "remove", value: 1 },
      ],
    });
    const newConfig = asConfig({
      d: [
        { id: "change", value: 2 },
        { id: "add", value: 1 },
      ],
    });

    const byIdentity = Object.fromEntries(
      diffConfig(oldConfig, newConfig, [collector]).changes.map((c) => [
        c.identity,
        c,
      ]),
    );

    // Only in-place `changed` is gated by the rule; add/remove stay supported.
    expect(byIdentity.change.supported).toBe(false);
    expect(byIdentity.remove.supported).toBe(true);
    expect(byIdentity.add.supported).toBe(true);
  });

  test("runs every registered collector and stamps its domain", () => {
    const oldConfig = asConfig({ a: [{ id: "x", value: 1 }], b: [] });
    const newConfig = asConfig({ a: [], b: [{ id: "y", value: 1 }] });

    const { changes } = diffConfig(oldConfig, newConfig, [
      makeCollector("a", PERMISSIVE_RULE),
      makeCollector("b", PERMISSIVE_RULE),
    ]);

    expect(changes).toEqual([
      expect.objectContaining({ domain: "a", identity: "x", kind: "removed" }),
      expect.objectContaining({ domain: "b", identity: "y", kind: "added" }),
    ]);
  });
});

describe("classification helpers", () => {
  const rule: DomainRule = {
    destructiveOnRemove: true,
    unsupportedOnChange: true,
  };
  const collector = makeCollector("d", rule);

  test("isEmptyPlan / getOperativeChanges ignore unchanged entries", () => {
    const config = asConfig({ d: [{ id: "keep", value: 1 }] });
    const unchanged = diffConfig(config, config, [collector]);

    expect(isEmptyPlan(unchanged)).toBe(true);
    expect(getOperativeChanges(unchanged)).toEqual([]);

    const withAdd = diffConfig(
      config,
      asConfig({
        d: [
          { id: "keep", value: 1 },
          { id: "add", value: 1 },
        ],
      }),
      [collector],
    );
    expect(isEmptyPlan(withAdd)).toBe(false);
    expect(getOperativeChanges(withAdd)).toHaveLength(1);
  });

  test("getChangesForDomain filters to a single domain's operative changes", () => {
    const diff = diffConfig(
      asConfig({ a: [{ id: "x", value: 1 }], b: [{ id: "keep", value: 1 }] }),
      asConfig({ a: [], b: [{ id: "keep", value: 1 }] }),
      [makeCollector("a", rule), makeCollector("b", rule)],
    );

    const forA = getChangesForDomain(diff, "a");
    expect(forA).toHaveLength(1);
    expect(forA[0]).toEqual(
      expect.objectContaining({ domain: "a", kind: "removed" }),
    );
    expect(getChangesForDomain(diff, "b")).toEqual([]);
  });

  test("configHasDestructiveChange only counts operative destructive changes", () => {
    const noRemoval = diffConfig(
      asConfig({ d: [{ id: "keep", value: 1 }] }),
      asConfig({
        d: [
          { id: "keep", value: 1 },
          { id: "add", value: 1 },
        ],
      }),
      [collector],
    );
    expect(configHasDestructiveChange(noRemoval)).toBe(false);

    const withRemoval = diffConfig(
      asConfig({ d: [{ id: "gone", value: 1 }] }),
      asConfig({ d: [] }),
      [collector],
    );
    expect(configHasDestructiveChange(withRemoval)).toBe(true);
  });

  test("configHasUnsupportedChange flags an unsupported in-place change", () => {
    const withChange = diffConfig(
      asConfig({ d: [{ id: "a", value: 1 }] }),
      asConfig({ d: [{ id: "a", value: 2 }] }),
      [collector],
    );
    expect(configHasUnsupportedChange(withChange)).toBe(true);

    const onlyAdd = diffConfig(
      asConfig({ d: [] }),
      asConfig({ d: [{ id: "a", value: 1 }] }),
      [collector],
    );
    expect(configHasUnsupportedChange(onlyAdd)).toBe(false);
  });
});

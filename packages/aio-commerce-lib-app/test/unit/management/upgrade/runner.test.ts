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

import { describe, expect, test, vi } from "vitest";

import {
  executeUpgrade,
  planUpgrade,
  UnsupportedUpgradeError,
} from "#management/upgrade/runner";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { LifecycleContext } from "#management/common/workflow/index";
import type { UpgradeDomain } from "#management/upgrade/runner";
import type { DomainCollector, DomainRule } from "#management/upgrade/types";

type TestConfig = Record<string, { id: string; value: unknown }[]>;

const PERMISSIVE_RULE: DomainRule = {
  destructiveOnRemove: false,
  unsupportedOnChange: false,
};

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

function asConfig(config: TestConfig): CommerceAppConfigOutputModel {
  return config as unknown as CommerceAppConfigOutputModel;
}

function makeDomain(
  name: string,
  rule: DomainRule = PERMISSIVE_RULE,
  reconcile?: UpgradeDomain["reconcile"],
): UpgradeDomain {
  return { collectors: [makeCollector(name, rule)], name, reconcile };
}

const context = {
  logger: { debug: vi.fn() },
} as unknown as LifecycleContext;

describe("planUpgrade", () => {
  test("aggregates every domain's collectors into one diff", () => {
    const diff = planUpgrade(
      asConfig({ a: [{ id: "x", value: 1 }], b: [] }),
      asConfig({ a: [], b: [{ id: "y", value: 1 }] }),
      [makeDomain("a"), makeDomain("b")],
    );

    expect(diff.changes).toEqual([
      expect.objectContaining({ domain: "a", identity: "x", kind: "removed" }),
      expect.objectContaining({ domain: "b", identity: "y", kind: "added" }),
    ]);
  });
});

describe("executeUpgrade", () => {
  test("returns empty status and reconciles nothing when configs match", async () => {
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const config = asConfig({ a: [{ id: "x", value: 1 }] });

    const result = await executeUpgrade({
      baseline: { config },
      context,
      domains: [makeDomain("a", PERMISSIVE_RULE, reconcile)],
      targetConfig: config,
    });

    expect(result.status).toBe("empty");
    expect(reconcile).not.toHaveBeenCalled();
  });

  test("reconciles only domains that have operative changes", async () => {
    const reconcileA = vi.fn().mockResolvedValue(undefined);
    const reconcileB = vi.fn().mockResolvedValue(undefined);

    const result = await executeUpgrade({
      baseline: {
        config: asConfig({
          a: [{ id: "x", value: 1 }],
          b: [{ id: "y", value: 1 }],
        }),
      },
      context,
      domains: [
        makeDomain("a", PERMISSIVE_RULE, reconcileA),
        makeDomain("b", PERMISSIVE_RULE, reconcileB),
      ],
      // Only domain "a" changes; "b" is untouched.
      targetConfig: asConfig({ a: [], b: [{ id: "y", value: 1 }] }),
    });

    expect(result.status).toBe("applied");
    expect(reconcileA).toHaveBeenCalledTimes(1);
    expect(reconcileB).not.toHaveBeenCalled();
  });

  test("throws UnsupportedUpgradeError without reconciling when a change is unsupported", async () => {
    const reconcile = vi.fn().mockResolvedValue(undefined);
    const domain = makeDomain(
      "a",
      { destructiveOnRemove: false, unsupportedOnChange: true },
      reconcile,
    );

    await expect(
      executeUpgrade({
        baseline: { config: asConfig({ a: [{ id: "x", value: 1 }] }) },
        context,
        domains: [domain],
        targetConfig: asConfig({ a: [{ id: "x", value: 2 }] }),
      }),
    ).rejects.toBeInstanceOf(UnsupportedUpgradeError);

    expect(reconcile).not.toHaveBeenCalled();
  });

  test("skips a domain that has no reconcile handler", async () => {
    const result = await executeUpgrade({
      baseline: { config: asConfig({ a: [] }) },
      context,
      domains: [makeDomain("a")],
      targetConfig: asConfig({ a: [{ id: "x", value: 1 }] }),
    });

    expect(result.status).toBe("applied");
  });
});

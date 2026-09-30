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

import { planWorkflow } from "#management/common/workflow/plan";
import { createMockConfig } from "#test/fixtures/config";
import { createMockInstallationContextWithScripts } from "#test/fixtures/installation";
import { createMockAppStateSnapshot } from "#test/fixtures/lifecycle";
import {
  createMockLifecycleLeaf,
  createMockLifecycleRoot,
} from "#test/fixtures/workflow";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const TARGET_VERSION = "2.0.0";

function createConfig(version: string): CommerceAppConfigOutputModel {
  return createMockConfig({ metadata: { id: "synthetic-app", version } });
}

/** Creates a leaf that only plans an add when it has no baseline. */
function createAddOnlyLeaf(name: string) {
  return createMockLifecycleLeaf({
    isConfigured: (config): config is CommerceAppConfigOutputModel =>
      config.metadata.version === TARGET_VERSION,
    name,
    plan: async (input) => ({
      kind: "planned" as const,
      plan: {
        operations:
          !input.baseline && input.targetConfig
            ? [
                {
                  after: { name },
                  id: `add-${name}`,
                  kind: "add" as const,
                  label: `Add ${name}`,
                },
              ]
            : [],
        path: input.path,
      },
    }),
  });
}

function createOptions(
  baseline: Parameters<typeof planWorkflow>[0]["baseline"],
) {
  return {
    baseline,
    lifecycleContext: createMockInstallationContextWithScripts(),
    rootStep: createMockLifecycleRoot([
      createAddOnlyLeaf("synthetic"),
      createAddOnlyLeaf("secondary"),
    ]),
    target: { config: createConfig(TARGET_VERSION) },
  };
}

describe("planWorkflow", () => {
  test("plans pure adds when there is no baseline", async () => {
    const result = await planWorkflow(createOptions(null));

    expect(result.issues).toEqual([]);
    expect(result.domains.map((domain) => domain.path)).toEqual([
      ["root", "synthetic"],
      ["root", "secondary"],
    ]);

    const operations = result.domains.flatMap((domain) => domain.operations);
    expect(operations).toHaveLength(2);
    expect(operations.map((operation) => operation.kind)).toEqual([
      "add",
      "add",
    ]);
  });

  test("matches a baseline whose config configures nothing", async () => {
    const configuresNothing = createMockAppStateSnapshot({
      config: createConfig("1.0.0"),
    });

    const [withoutBaseline, withEmptyBaseline] = await Promise.all([
      planWorkflow(createOptions(null)),
      planWorkflow(createOptions(configuresNothing)),
    ]);

    expect(withoutBaseline).toEqual(withEmptyBaseline);
  });
});

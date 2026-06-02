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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { describe, expect, test } from "vitest";
import { stringify } from "yaml";

import { validateRuntimeActionReferences } from "#commands/hooks/validate-runtime-actions";
import {
  configWithAdminUiSdk,
  configWithFullAdminUiSdk,
} from "#test/fixtures/config";
import { makeProjectFiles, withTempProject } from "#test/fixtures/project";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const WORKER_RUNTIME_ACTION = "customers/export-customers";

/** app.config.yaml with inline workerProcess operations */
function makeAppConfigYaml(workerProcessImpls: string[]): string {
  return stringify({
    extensions: {
      "commerce/backend-ui/2": {
        operations: {
          workerProcess: workerProcessImpls.map((impl) => ({
            type: "action",
            impl,
          })),
        },
      },
    },
  });
}

/** app.config.yaml that delegates to an $include */
function makeAppConfigYamlWithInclude(includePath: string): string {
  return stringify({
    extensions: {
      "commerce/backend-ui/2": {
        $include: includePath,
      },
    },
  });
}

/** ext.config.yaml with workerProcess operations */
function makeExtConfigYaml(workerProcessImpls: string[]): string {
  return stringify({
    operations: {
      workerProcess: workerProcessImpls.map((impl) => ({
        type: "action",
        impl,
      })),
    },
  });
}

/** A config with only a view mass action (no worker, no runtimeAction). */
const configWithViewOnly: CommerceAppConfigOutputModel = {
  ...configWithAdminUiSdk,
  metadata: { ...configWithAdminUiSdk.metadata, id: "test-view-only" },
};

describe("validateRuntimeActionReferences", () => {
  test("resolves when the worker runtimeAction is declared inline in app.config.yaml", async () => {
    const projectFiles = makeProjectFiles(configWithFullAdminUiSdk, "esm", {
      "app.config.yaml": makeAppConfigYaml([WORKER_RUNTIME_ACTION]),
    });

    await withTempProject(projectFiles, async () => {
      await expect(
        validateRuntimeActionReferences(configWithFullAdminUiSdk),
      ).resolves.toBeUndefined();
    });
  });

  test("resolves when the worker runtimeAction is declared via $include in ext.config.yaml", async () => {
    const includePath = "src/commerce-backend-ui-2/ext.config.yaml";
    const projectFiles = makeProjectFiles(configWithFullAdminUiSdk, "esm", {
      "app.config.yaml": makeAppConfigYamlWithInclude(includePath),
      [includePath]: makeExtConfigYaml([WORKER_RUNTIME_ACTION]),
    });

    await withTempProject(projectFiles, async () => {
      await expect(
        validateRuntimeActionReferences(configWithFullAdminUiSdk),
      ).resolves.toBeUndefined();
    });
  });

  test("rejects with CommerceSdkValidationError when the runtimeAction has no matching workerProcess impl", async () => {
    const projectFiles = makeProjectFiles(configWithFullAdminUiSdk, "esm", {
      "app.config.yaml": makeAppConfigYaml(["other/unrelated-action"]),
    });

    await withTempProject(projectFiles, async () => {
      await expect(
        validateRuntimeActionReferences(configWithFullAdminUiSdk),
      ).rejects.toThrow(CommerceSdkValidationError);

      await expect(
        validateRuntimeActionReferences(configWithFullAdminUiSdk),
      ).rejects.toThrow(WORKER_RUNTIME_ACTION);
    });
  });

  test("resolves early when there are only view mass actions (no worker runtimeAction)", async () => {
    // No app.config.yaml provided — if the function tried to read it, it would
    // use an empty YAML document (readYamlFile handles missing files gracefully),
    // meaning no workerProcess impls are declared. The function must return
    // before reaching that point.
    const projectFiles = makeProjectFiles(configWithViewOnly, "esm");

    await withTempProject(projectFiles, async () => {
      await expect(
        validateRuntimeActionReferences(configWithViewOnly),
      ).resolves.toBeUndefined();
    });
  });
});

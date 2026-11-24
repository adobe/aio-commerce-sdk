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

import { join } from "node:path";

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";

import { validateRuntimeActionReferences } from "#commands/common/runtime-actions";
import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
} from "#commands/constants";
import { getExtConfigPath } from "#commands/utils";
import {
  configWithCommerceEventing,
  configWithWebhooks,
  configWithWorkerMassActions,
} from "#test/fixtures/config";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import type { CommerceAppConfigReferencingRuntimeActions } from "#commands/common/runtime-actions";

type Scope =
  | typeof BACKEND_UI_V2_EXTENSION_POINT_ID
  | typeof EXTENSIBILITY_EXTENSION_POINT_ID;

type ActionDef = { function?: string; web?: string };

function extConfigWith(actions: Record<string, ActionDef>): ExtConfig {
  const packages: Record<string, { actions: Record<string, ActionDef> }> = {};
  for (const [reference, def] of Object.entries(actions)) {
    const [packageName, actionName] = reference.split("/");
    packages[packageName] ??= { actions: {} };
    packages[packageName].actions[actionName] = def;
  }
  return { runtimeManifest: { packages } } as ExtConfig;
}

function appConfigFor(scope: Scope) {
  return [
    "extensions:",
    `  ${scope}:`,
    `    $include: ${getExtConfigPath(scope)}`,
  ].join("\n");
}

/**
 * Runs the validator in a temp project where `files` exist under the extension point folder
 * and `projectFiles` exist relative to the project root.
 */
function validate(
  sections: CommerceAppConfigReferencingRuntimeActions,
  scope: Scope,
  actions: Record<string, ActionDef>,
  files: string[] = [],
  projectFiles: Record<string, string> = {},
) {
  const folder = getExtensionPointFolderPath(scope);
  return withTempFiles(
    {
      [APP_CONFIG_FILE]: appConfigFor(scope),
      [getExtConfigPath(scope)]: JSON.stringify(extConfigWith(actions)),
      ...Object.fromEntries(files.map((file) => [join(folder, file), ""])),
      ...projectFiles,
    },
    (tempDir) =>
      validateRuntimeActionReferences(sections, {
        extensionPointId: scope,
        path: getExtConfigPath(scope),
        projectRoot: tempDir,
      }),
  );
}

async function issuesOf(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(Error);
  return (error as Error).message;
}

describe("validateRuntimeActionReferences", () => {
  test("passes when every referenced action is declared with an existing function", async () => {
    await expect(
      validate(
        { adminUi: configWithWorkerMassActions.adminUi },
        BACKEND_UI_V2_EXTENSION_POINT_ID,
        { "customers/export-customers": { function: "actions/export.js" } },
        ["actions/export.js"],
      ),
    ).resolves.toBeUndefined();
  });

  test("reports an undeclared adminUi action at its config path", async () => {
    const display = await issuesOf(
      validate(
        { adminUi: configWithWorkerMassActions.adminUi },
        BACKEND_UI_V2_EXTENSION_POINT_ID,
        {
          "customers/other": { function: "actions/other.js" },
        },
      ),
    );

    expect(display).toContain("adminUi.customer.massActions.0.runtimeAction");
    expect(display).toContain(
      'Runtime action "customers/export-customers" is not declared under "runtimeManifest.packages" in src/commerce-backend-ui-2/ext.config.yaml',
    );
  });

  test("reports a declared action whose function does not exist", async () => {
    const display = await issuesOf(
      validate(
        { eventing: configWithCommerceEventing.eventing },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        {
          "my-package/handle-order": { function: "actions/missing.js" },
        },
      ),
    );

    expect(display).toContain("eventing.commerce.0.events.0.runtimeActions.0");
    expect(display).toContain(
      'points to "src/commerce-extensibility-1/actions/missing.js"',
    );
  });

  test("reports a declared action without a function", async () => {
    const display = await issuesOf(
      validate(
        { eventing: configWithCommerceEventing.eventing },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        {
          "my-package/handle-order": {},
        },
      ),
    );

    expect(display).toContain('has no "function"');
  });

  test("requires webhook actions to be web actions", async () => {
    const display = await issuesOf(
      validate(
        { webhooks: configWithWebhooks.webhooks },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        { "my-package/handle-webhook": { function: "actions/hook.js" } },
        ["actions/hook.js"],
      ),
    );

    expect(display).toContain("webhooks.0.runtimeAction");
    expect(display).toContain("must be a web action");
  });

  test("accepts webhook actions declared as web actions", async () => {
    await expect(
      validate(
        { webhooks: configWithWebhooks.webhooks },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        {
          "my-package/handle-webhook": {
            function: "actions/hook.js",
            web: "yes",
          },
        },
        ["actions/hook.js"],
      ),
    ).resolves.toBeUndefined();
  });

  test("does not require event actions to be web actions", async () => {
    await expect(
      validate(
        { eventing: configWithCommerceEventing.eventing },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        { "my-package/handle-order": { function: "actions/order.js" } },
        ["actions/order.js"],
      ),
    ).resolves.toBeUndefined();
  });

  test("requires eventing and webhook actions to be declared in the extensibility extension", async () => {
    const appConfigYaml = [
      "application:",
      "  runtimeManifest:",
      "    packages:",
      "      my-package:",
      "        actions:",
      "          handle-webhook:",
      "            function: actions/hook.js",
      "            web: 'yes'",
    ].join("\n");

    const display = await issuesOf(
      validate(
        { webhooks: configWithWebhooks.webhooks },
        EXTENSIBILITY_EXTENSION_POINT_ID,
        {},
        [],
        {
          "actions/hook.js": "",
          "app.config.yaml": `${appConfigYaml}\n${appConfigFor(EXTENSIBILITY_EXTENSION_POINT_ID)}`,
        },
      ),
    );

    expect(display).toContain(
      'Runtime action "my-package/handle-webhook" is not declared under "runtimeManifest.packages" in src/commerce-extensibility-1/ext.config.yaml',
    );
  });

  test("resolves function paths relative to an included runtime manifest", async () => {
    const folder = getExtensionPointFolderPath(
      EXTENSIBILITY_EXTENSION_POINT_ID,
    );
    const manifestYaml = [
      "packages:",
      "  my-package:",
      "    actions:",
      "      handle-order:",
      "        function: actions/order.js",
    ].join("\n");

    await expect(
      withTempFiles(
        {
          [APP_CONFIG_FILE]: appConfigFor(EXTENSIBILITY_EXTENSION_POINT_ID),
          [getExtConfigPath(EXTENSIBILITY_EXTENSION_POINT_ID)]:
            "runtimeManifest:\n  $include: nested/manifest.yaml",
          [join(folder, "nested/manifest.yaml")]: manifestYaml,
          [join(folder, "nested/actions/order.js")]: "",
        },
        (tempDir) =>
          validateRuntimeActionReferences(
            { eventing: configWithCommerceEventing.eventing },
            {
              extensionPointId: EXTENSIBILITY_EXTENSION_POINT_ID,
              path: getExtConfigPath(EXTENSIBILITY_EXTENSION_POINT_ID),
              projectRoot: tempDir,
            },
          ),
      ),
    ).resolves.toBeUndefined();
  });

  test("requires adminUi actions to be declared in the backend-ui extension", async () => {
    const appConfigYaml = [
      "application:",
      "  runtimeManifest:",
      "    packages:",
      "      customers:",
      "        actions:",
      "          export-customers:",
      "            function: actions/export.js",
    ].join("\n");

    const display = await issuesOf(
      validate(
        { adminUi: configWithWorkerMassActions.adminUi },
        BACKEND_UI_V2_EXTENSION_POINT_ID,
        {},
        [],
        {
          "actions/export.js": "",
          "app.config.yaml": `${appConfigYaml}\n${appConfigFor(BACKEND_UI_V2_EXTENSION_POINT_ID)}`,
        },
      ),
    );

    expect(display).toContain("is not declared");
  });
});

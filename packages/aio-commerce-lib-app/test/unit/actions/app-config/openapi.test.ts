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

import { buildOpenApiSpec } from "#actions/app-config/openapi";
import { getConfigDomains } from "#config/schema/domains";
import openApiSpec from "#openapi.json" with { type: "json" };
import {
  configWithBusinessConfig,
  configWithFullAdminUiSdk,
  configWithOneScript,
  minimalValidConfig,
  mockMetadata,
} from "#test/fixtures/config";
import { createMockLogger } from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Config exercising every capability, so no path is stripped. */
const fullyCapableConfig = {
  metadata: mockMetadata,
  businessConfig: configWithBusinessConfig.businessConfig,
  adminUi: configWithFullAdminUiSdk.adminUi,
  installation: configWithOneScript.installation,
} satisfies CommerceAppConfigOutputModel;

const logger = createMockLogger();

describe("buildOpenApiSpec", () => {
  test("keeps every path and schema when all capabilities are present", async () => {
    const spec = await buildOpenApiSpec(
      getConfigDomains(fullyCapableConfig),
      logger,
    );

    expect(Object.keys(spec.paths).sort()).toEqual(
      Object.keys(openApiSpec.paths).sort(),
    );
    expect(Object.keys(spec.components.schemas).sort()).toEqual(
      Object.keys(openApiSpec.components.schemas).sort(),
    );
  });

  test("strips the paths for capabilities the app does not use", async () => {
    const paths = Object.keys(
      (await buildOpenApiSpec(getConfigDomains(minimalValidConfig), logger))
        .paths,
    );

    expect(paths).toContain("/app-config");
    expect(paths).not.toContain("/config");
    expect(paths).not.toContain("/scope-tree");
    expect(paths).not.toContain("/scope-tree/commerce");
    expect(paths).not.toContain("/registration");
    expect(paths).not.toContain("/installation");
  });

  test("prunes schemas left unreferenced by the stripped paths", async () => {
    const schemas = Object.keys(
      (await buildOpenApiSpec(getConfigDomains(minimalValidConfig), logger))
        .components.schemas,
    );

    // With only `/app-config` surviving, the config, scope-tree and installation
    // schemas are all left unreferenced and pruned.
    for (const orphaned of [
      "ConfigScope",
      "ConfigOrigin",
      "ConfigValue",
      "ConfigUpdateEntry",
      "ScopeNode",
      "CustomScopeOutput",
      "CustomScopeInput",
      "ValidationErrorResponse",
      "AppData",
      "StepStatus",
      "StepValidationResult",
      "StepMetaInfo",
      "ValidationIssue",
    ]) {
      expect(schemas).not.toContain(orphaned);
    }

    // Still reachable from `/app-config` (its error response and the
    // eventing / Admin UI SDK / webhook payloads it documents).
    // "AdminUiSdkRegistration" is an OpenAPI schema/contract identifier, not a TS type.
    for (const retained of [
      "ErrorResponse",
      "AdminUiSdkRegistration",
      "EventProvider",
      "RuntimeActionWebhookConfig",
      "WebhookDefinition",
    ]) {
      expect(schemas).toContain(retained);
    }
  });

  test("keeps all tags when all capabilities are present", async () => {
    const spec = await buildOpenApiSpec(
      getConfigDomains(fullyCapableConfig),
      logger,
    );

    const tagNames = spec.tags.map((t) => t.name);

    expect(tagNames).toContain("App Metadata");
    expect(tagNames).toContain("Business Configuration");
    expect(tagNames).toContain("Management");
    expect(tagNames).toContain("Admin UI");
  });

  test("prunes tags left unreferenced by the stripped paths", async () => {
    const spec = await buildOpenApiSpec(
      getConfigDomains(minimalValidConfig),
      logger,
    );

    const tagNames = spec.tags.map((t) => t.name);

    expect(tagNames).toContain("App Metadata");
    expect(tagNames).not.toContain("Business Configuration");
    expect(tagNames).not.toContain("Management");
    expect(tagNames).not.toContain("Admin UI");
  });

  test("does not mutate the shared spec import", async () => {
    await buildOpenApiSpec(getConfigDomains(minimalValidConfig), logger);

    expect(Object.keys(openApiSpec.paths)).toContain("/config");
    expect(Object.keys(openApiSpec.components.schemas)).toContain(
      "ConfigScope",
    );
  });
});

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

import { hasAdminUiSdk } from "#config/schema/admin-ui-sdk";
import { requiresInstallation } from "#config/schema/app";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";

import type AioLogger from "@adobe/aio-lib-core-logging";
import type { CommerceAppConfig } from "#config/schema/app";

/**
 * Loads the committed OpenAPI spec.
 *
 * Relative path with no import attribute on purpose: that combination is what
 * makes the bundler code-split the spec into its own lazily-loaded chunk. The
 * `#openapi.json` alias leaves it as an unresolved runtime specifier, and a
 * `with { type: "json" }` attribute makes it inline back into the action.
 */
const importOpenApi = () => import("../../../docs/openapi.json");

type OpenApiSpec = Awaited<ReturnType<typeof importOpenApi>>["default"];
type SpecPath = keyof OpenApiSpec["paths"];

/** Matches component schema `$ref` strings, capturing the schema name. */
const SCHEMA_REF_PATTERN = /"#\/components\/schemas\/(\w+)"/g;

/**
 * Collects the names of every component schema referenced via `$ref` in a value
 * Scans the serialized JSON, so it catches refs at any depth.
 *
 * @param value - Any part of the spec to scan.
 */
function collectSchemaRefs(value: unknown) {
  const matches = (JSON.stringify(value) ?? "").matchAll(SCHEMA_REF_PATTERN);
  return [...matches].map((match) => match[1]);
}

/**
 * Deletes component schemas not reachable from the remaining paths, in place.
 *
 * Follows `$ref`s transitively from `spec.paths`; the visited set handles
 * recursive schemas (e.g. `ScopeNode`).
 *
 * @param spec - The spec to prune, after paths have been stripped.
 */
function pruneUnusedSchemas(spec: OpenApiSpec) {
  const schemas = spec.components.schemas as Record<string, unknown>;

  const reachable = new Set(collectSchemaRefs(spec.paths));
  const pending = [...reachable];

  while (pending.length > 0) {
    const name = pending.pop();
    if (name === undefined) {
      continue;
    }

    for (const ref of collectSchemaRefs(schemas[name])) {
      if (!reachable.has(ref)) {
        reachable.add(ref);
        pending.push(ref);
      }
    }
  }

  for (const name of Object.keys(schemas)) {
    if (!reachable.has(name)) {
      delete schemas[name];
    }
  }
}

/**
 * Builds the OpenAPI spec served by `GET /openapi.json`, tailored to the app's
 * capabilities: unused paths are stripped, along with the schemas they leave
 * unreferenced.
 *
 * Works on a fresh copy so the shared module import is never mutated. The
 * committed `docs/openapi.json` always describes the full surface.
 *
 * The spec is loaded via dynamic import so it lands in its own chunk and is
 * only parsed when this route is actually called, not on every cold start.
 *
 * @param appConfig - The resolved app config whose capabilities drive trimming.
 * @param logger - Logger used to report which paths get stripped.
 */
export async function buildOpenApiSpec(
  appConfig: CommerceAppConfig,
  logger: ReturnType<typeof AioLogger>,
) {
  const { default: openAPISpec } = await importOpenApi();

  const spec = structuredClone(openAPISpec);
  const stripPath = (path: SpecPath) => {
    if (spec.paths[path]) {
      logger.debug(`Stripping OpenAPI spec path: ${path}`);
      delete spec.paths[path];
    }
  };

  if (!hasBusinessConfigSchema(appConfig)) {
    logger.debug(
      "Application doesn't define business configuration, stripping references...",
    );

    stripPath("/config");
    stripPath("/scope-tree");
    stripPath("/scope-tree/commerce");
  }

  if (!hasAdminUiSdk(appConfig)) {
    logger.debug(
      "Application doesn't define Admin UI SDK registration, stripping references...",
    );

    stripPath("/registration");
  }

  if (!requiresInstallation(appConfig)) {
    logger.debug(
      "Application doesn't require installation, stripping references...",
    );

    stripPath("/installation");
    stripPath("/installation/validation");
    stripPath("/installation/uninstallation");
  }

  pruneUnusedSchemas(spec);

  spec.servers[0].url = `https://${process.env.__OW_NAMESPACE}.adobeioruntime.net/api/v1/web/app-management`;
  return spec;
}

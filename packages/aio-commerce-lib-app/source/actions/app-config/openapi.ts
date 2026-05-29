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

import { createHash } from "node:crypto";

import { requiresInstallationFromDomains } from "#config/schema/app";

import type AioLogger from "@adobe/aio-lib-core-logging";
import type { CommerceAppConfigDomain } from "#config/schema/domains";

// __PKG_VERSION__ is injected and replaced at build time.
declare const __PKG_VERSION__: string;

/**
 * Loads the committed OpenAPI spec via dynamic import so it
 * lands in its own chunk and is not parsed on every cold start.
 */
const importOpenApi = () =>
  import("../../../docs/openapi.json", { with: { type: "json" } });

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
 * Computes a short hash identifying the spec served for the given config domains.
 * Changes whenever the served spec would: with the package version (which tracks
 * the committed spec's `info.version`) or with the domains that drive pruning.
 *
 * @param domains - The active config domains.
 */
export function getOpenApiCacheKey(domains: Set<CommerceAppConfigDomain>) {
  const input = `${__PKG_VERSION__}:${[...domains].sort().join(",")}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 8);
}

/** Returns the server URL to be set in the OpenAPI spec, based on the current namespace. */
export function getServerUrl() {
  return `https://${process.env.__OW_NAMESPACE}.adobeioruntime.net/api/v1/web/app-management`;
}

/**
 * Builds the OpenAPI spec served by `GET /openapi.json`, tailored to the app's
 * capabilities: unused paths are stripped, along with the schemas they leave
 * unreferenced.
 *
 * Works on a fresh copy so the shared module import is never mutated. The
 * committed `docs/openapi.json` always describes the full surface.
 *
 * @param domains - The active config domains that drive path trimming.
 * @param logger - Logger used to report which paths get stripped.
 */
export async function buildOpenApiSpec(
  domains: Set<CommerceAppConfigDomain>,
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

  if (!domains.has("businessConfig.schema")) {
    logger.debug(
      "Application doesn't define business configuration, stripping references...",
    );

    stripPath("/config");
    stripPath("/scope-tree");
    stripPath("/scope-tree/commerce");
  }

  if (!domains.has("adminUiSdk")) {
    logger.debug(
      "Application doesn't define Admin UI SDK registration, stripping references...",
    );

    stripPath("/registration");
  }

  if (!requiresInstallationFromDomains(domains)) {
    logger.debug(
      "Application doesn't require installation, stripping references...",
    );

    stripPath("/installation");
    stripPath("/installation/validation");
    stripPath("/installation/uninstallation");
  }

  pruneUnusedSchemas(spec);

  spec.servers[0].url = getServerUrl();
  return spec;
}

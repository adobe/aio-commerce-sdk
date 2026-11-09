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

import { v7 as generateUUID } from "uuid";
import * as v from "valibot";

import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPasswordFields } from "#modules/schema/utils";
import {
  paginate,
  serializeHistory,
  VersionSchema,
} from "#utils/history-storage";

import { calculateDiff } from "./diff-calculator";
import {
  redactSensitiveConfig,
  redactSensitiveDiffs,
} from "./secret-redaction";
import { listVersions } from "./version-repository";

import type {
  ConfigVersion,
  CreateVersionRequest,
  GetVersionHistoryRequest,
  VersionContext,
} from "./types";

/** Reads and validates the configured per-scope retention count. */
export function getMaxVersions() {
  const count = Number(process.env.MAX_CONFIG_VERSIONS ?? 25);
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000) {
    throw new Error(
      "INVALID_RETENTION: MAX_CONFIG_VERSIONS must be an integer from 1 to 1000",
    );
  }
  return count;
}

/** Prepares a redacted version and validates its size before changing live configuration. */
export async function prepareVersion(
  context: VersionContext,
  request: CreateVersionRequest,
) {
  const versions = await listVersions(context.namespace, request.scope.code);
  const latest = versions.at(0);
  const passwordFields = getPasswordFields(requireGlobalSchema());
  const version: ConfigVersion = {
    actor: request.actor
      ? { source: request.actor.source, userId: request.actor.userId }
      : undefined,
    diff: redactSensitiveDiffs(
      calculateDiff(request.oldConfig, request.newConfig),
      passwordFields,
    ),
    id: generateUUID(),
    previousVersionId: latest?.id ?? null,
    scope: request.scope,
    snapshot: redactSensitiveConfig(request.newConfig, passwordFields),
    timestamp: new Date().toISOString(),
    versionNumber: (latest?.versionNumber ?? 0) + 1,
  };
  if (!Number.isSafeInteger(version.versionNumber)) {
    throw new Error("INVALID_VERSION_NUMBER: version sequence exhausted");
  }
  serializeHistory(v.parse(VersionSchema, version));
  return { expired: versions.slice(context.maxVersions - 1), version };
}

/** Gets a validated page of retained, redacted versions. */
export async function getVersionHistory(
  context: Pick<VersionContext, "namespace">,
  request: GetVersionHistoryRequest,
) {
  paginate([], request, 25);
  const versions = await listVersions(context.namespace, request.scopeCode);
  const page = paginate(versions, request, 25);
  return { pagination: page.pagination, versions: page.items };
}

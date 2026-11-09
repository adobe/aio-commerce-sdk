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

import { applyDiff, calculateDiff, invertDiff } from "./diff-calculator";
import { getVersion } from "./version-repository";

import type {
  TwoVersionComparison,
  VersionComparison,
  VersionContext,
} from "./types";

/** Gets the redacted before/after state for one retained version. */
export async function getVersionComparison(
  context: Pick<VersionContext, "namespace">,
  scopeCode: string,
  versionId: string,
): Promise<VersionComparison | null> {
  const version = await getVersion(context.namespace, scopeCode, versionId);
  return version
    ? {
        after: version.snapshot,
        before: applyDiff(version.snapshot, invertDiff(version.diff)),
        changes: version.diff,
        version,
      }
    : null;
}

/** Compares two retained snapshots without reconstructing intermediate versions. */
export async function compareTwoVersions(
  context: Pick<VersionContext, "namespace">,
  scopeCode: string,
  fromVersionId: string,
  toVersionId: string,
): Promise<TwoVersionComparison | null> {
  const [fromVersion, toVersion] = await Promise.all([
    getVersion(context.namespace, scopeCode, fromVersionId),
    getVersion(context.namespace, scopeCode, toVersionId),
  ]);
  return fromVersion && toVersion
    ? {
        changes: calculateDiff(fromVersion.snapshot, toVersion.snapshot),
        fromConfig: fromVersion.snapshot,
        fromVersion,
        toConfig: toVersion.snapshot,
        toVersion,
      }
    : null;
}

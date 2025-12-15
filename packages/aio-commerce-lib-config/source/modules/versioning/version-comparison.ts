/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { applyDiff, calculateDiff } from "./diff-calculator";
import * as versionRepository from "./version-repository";

import type { ConfigValue } from "#modules/configuration/types";
import type {
  ConfigDiff,
  ConfigVersion,
  TwoVersionComparison,
  VersionComparison,
  VersionContext,
} from "./types";

/**
 * Gets before/after comparison for a specific version.
 *
 * Perfect for UI display showing what changed in a specific version.
 *
 * @param context - Version context.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID to get comparison for.
 * @returns Before/after comparison or null if version not found.
 */
export async function getVersionComparison(
  context: VersionContext,
  scopeCode: string,
  versionId: string,
): Promise<VersionComparison | null> {
  const version = await versionRepository.getVersion(
    context.namespace,
    scopeCode,
    versionId,
  );

  if (!version) {
    return null;
  }

  const configurationBeforeChange = reconstructBeforeState(
    version.snapshot,
    version.diff,
  );

  return {
    version,
    before: configurationBeforeChange,
    after: version.snapshot,
    changes: version.diff,
  };
}

/**
 * Compares two versions side-by-side.
 *
 * Useful for UI features like "compare version 5 with version 10".
 *
 * @param context - Version context.
 * @param scopeCode - Scope code.
 * @param fromVersionId - Earlier version ID.
 * @param toVersionId - Later version ID.
 * @returns Comparison of two versions or null if either version not found.
 */
export async function compareTwoVersions(
  context: VersionContext,
  scopeCode: string,
  fromVersionId: string,
  toVersionId: string,
): Promise<TwoVersionComparison | null> {
  const [earlierVersion, laterVersion] = await fetchBothVersions(
    context,
    scopeCode,
    fromVersionId,
    toVersionId,
  );

  if (!(earlierVersion && laterVersion)) {
    return null;
  }

  const changesBetweenVersions = calculateDiff(
    earlierVersion.snapshot,
    laterVersion.snapshot,
  );

  return {
    fromVersion: earlierVersion,
    toVersion: laterVersion,
    fromConfig: earlierVersion.snapshot,
    toConfig: laterVersion.snapshot,
    changes: changesBetweenVersions,
  };
}

/**
 * Fetches both versions in parallel for comparison.
 */
function fetchBothVersions(
  context: VersionContext,
  scopeCode: string,
  fromVersionId: string,
  toVersionId: string,
): Promise<[ConfigVersion | null, ConfigVersion | null]> {
  return Promise.all([
    versionRepository.getVersion(context.namespace, scopeCode, fromVersionId),
    versionRepository.getVersion(context.namespace, scopeCode, toVersionId),
  ]);
}

/**
 * Gets a version with its complete previous state reconstructed.
 *
 * @param context - Version context.
 * @param scopeCode - Scope code.
 * @param versionId - Version ID.
 * @returns Version with before state or null if not found.
 */
export async function getVersionWithBeforeState(
  context: VersionContext,
  scopeCode: string,
  versionId: string,
): Promise<{
  version: ConfigVersion;
  beforeState: ConfigValue[];
} | null> {
  const version = await versionRepository.getVersion(
    context.namespace,
    scopeCode,
    versionId,
  );

  if (!version) {
    return null;
  }

  const configurationBeforeChange = reconstructBeforeState(
    version.snapshot,
    version.diff,
  );

  return {
    version,
    beforeState: configurationBeforeChange,
  };
}

/**
 * Reconstructs configuration state before changes were applied.
 *
 * Reverses the diff to recreate the previous configuration snapshot.
 *
 * @param currentState - Configuration after changes.
 * @param appliedChanges - Changes that were applied.
 * @returns Configuration before changes were applied.
 */
function reconstructBeforeState(
  currentState: ConfigValue[],
  appliedChanges: ConfigDiff[],
): ConfigValue[] {
  const reversedChanges = invertDiffOperations(appliedChanges);
  return applyDiff(currentState, reversedChanges);
}

/**
 * Inverts diff operations to reverse configuration changes.
 *
 * - Added fields become removed
 * - Removed fields become added
 * - Modified fields swap old/new values
 */
function invertDiffOperations(changes: ConfigDiff[]): ConfigDiff[] {
  return changes.map((change) => {
    switch (change.type) {
      case "added":
        return createRemovedChange(change.name, change.newValue);
      case "removed":
        return createAddedChange(change.name, change.oldValue);
      case "modified":
        return createModifiedChange(
          change.name,
          change.newValue,
          change.oldValue,
        );
      default:
        // TypeScript exhaustiveness check - this should never happen
        return change satisfies never;
    }
  });
}

/**
 * Creates a "removed" change operation.
 */
function createRemovedChange(
  fieldName: string,
  previousValue: unknown,
): ConfigDiff {
  return {
    name: fieldName,
    oldValue: previousValue,
    type: "removed",
  };
}

/**
 * Creates an "added" change operation.
 */
function createAddedChange(fieldName: string, newValue: unknown): ConfigDiff {
  return {
    name: fieldName,
    newValue,
    type: "added",
  };
}

/**
 * Creates a "modified" change operation.
 */
function createModifiedChange(
  fieldName: string,
  oldValue: unknown,
  newValue: unknown,
): ConfigDiff {
  return {
    name: fieldName,
    oldValue,
    newValue,
    type: "modified",
  };
}

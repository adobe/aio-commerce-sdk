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

import * as v from "valibot";

import { hasCustomInstallationSteps } from "#config/schema/installation";

import { getCustomScriptStepName } from "./custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStepIdentity } from "./types";

/** Key under which 2.0 upgrades stored the run history as a single list. */
const HISTORY_LIST_KEY = "reconciliation";

/** The run history as a single list, oldest first, as 2.0 upgrades stored it. */
const HistoryListSchema = v.object({
  executedSteps: v.array(v.object({ name: v.string(), script: v.string() })),
});

/**
 * The record a step stored under its own key: `{ script, data }` from the legacy runner, or
 * `{ name, script }` from the per-step leaves.
 */
const StepRecordSchema = v.object({
  name: v.optional(v.string()),
  script: v.string(),
});

/** A step record and the key it was stored under. */
type StoredStepRecord = v.InferOutput<typeof StepRecordSchema> & {
  key: string;
};

/**
 * Reads which custom installation steps ran, oldest first, from the data stored under the custom
 * installation steps branch. Reads every format stored so far: one record per step, from the
 * legacy runner or the per-step leaves, and the single list stored by 2.0 upgrades. A step whose
 * key holds `null` was uninstalled and is left out.
 *
 * @param section - The data stored under the custom installation steps branch.
 * @param config - The config installed when the data was stored, or `null` when none was.
 */
export function readRunHistory(
  section: unknown,
  config: CommerceAppConfigOutputModel | null,
): CustomInstallationStepIdentity[] {
  if (typeof section !== "object" || section === null) {
    // Data stored without step records still had its config's steps run; taking none as run
    // would run them again.
    return getConfiguredSteps(config);
  }

  const stored = section as Record<string, unknown>;
  const listed = readHistoryList(stored).filter(
    (step) => stored[getCustomScriptStepName(step.name)] !== null,
  );

  const listedKeys = new Set(
    listed.map((step) => getCustomScriptStepName(step.name)),
  );

  const recorded = readStepRecords(stored)
    .filter((record) => !listedKeys.has(record.key))
    .map((record) => ({
      name: record.name ?? recoverName(record.key, config),
      script: record.script,
    }));

  return [...listed, ...recorded];
}

/** The steps of the list stored by 2.0 upgrades, or none when there is no such list. */
function readHistoryList(
  section: Record<string, unknown>,
): CustomInstallationStepIdentity[] {
  const result = v.safeParse(HistoryListSchema, section[HISTORY_LIST_KEY]);
  return result.success ? result.output.executedSteps : [];
}

/** The records stored one per step, in the order they were stored. */
function readStepRecords(section: Record<string, unknown>): StoredStepRecord[] {
  return Object.entries(section).flatMap(([key, value]) => {
    const result = v.safeParse(StepRecordSchema, value);
    return result.success ? [{ ...result.output, key }] : [];
  });
}

/** The name of the configured step whose records are stored under `key`, or the key itself. */
function recoverName(
  key: string,
  config: CommerceAppConfigOutputModel | null,
): string {
  const step = getConfiguredSteps(config).find(
    (candidate) => getCustomScriptStepName(candidate.name) === key,
  );

  return step?.name ?? key;
}

/** The custom installation steps a config declares, or none without a config. */
function getConfiguredSteps(
  config: CommerceAppConfigOutputModel | null,
): CustomInstallationStepIdentity[] {
  if (!(config && hasCustomInstallationSteps(config))) {
    return [];
  }

  return config.installation.customInstallationSteps.map(
    ({ name, script }) => ({ name, script }),
  );
}

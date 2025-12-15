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

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigDiff } from "./types";

/**
 * Calculates the difference between two configuration snapshots.
 *
 * @param previousConfiguration - Previous configuration values.
 * @param currentConfiguration - New configuration values.
 * @returns Array of configuration differences.
 */
export function calculateDiff(
  previousConfiguration: ConfigValue[],
  currentConfiguration: ConfigValue[],
): ConfigDiff[] {
  const previousConfigMap = createConfigurationMap(previousConfiguration);
  const currentConfigMap = createConfigurationMap(currentConfiguration);

  const addedAndModifiedFields = findAddedAndModifiedFields(
    previousConfigMap,
    currentConfigMap,
  );
  const removedFields = findRemovedFields(previousConfigMap, currentConfigMap);

  return [...addedAndModifiedFields, ...removedFields];
}

/**
 * Creates a map of configuration names to values.
 */
function createConfigurationMap(
  config: ConfigValue[],
): Map<string, ConfigValue["value"]> {
  return new Map(config.map((item) => [item.name, item.value]));
}

/**
 * Finds fields that were added or modified.
 */
function findAddedAndModifiedFields(
  previousConfigMap: Map<string, ConfigValue["value"]>,
  currentConfigMap: Map<string, ConfigValue["value"]>,
): ConfigDiff[] {
  const changes: ConfigDiff[] = [];

  for (const [fieldName, currentValue] of currentConfigMap) {
    const previousValue = previousConfigMap.get(fieldName);

    if (previousValue === undefined) {
      changes.push(createAddedFieldDiff(fieldName, currentValue));
    } else if (!areValuesEqual(previousValue, currentValue)) {
      changes.push(
        createModifiedFieldDiff(fieldName, previousValue, currentValue),
      );
    }
  }

  return changes;
}

/**
 * Finds fields that were removed.
 */
function findRemovedFields(
  previousConfigMap: Map<string, ConfigValue["value"]>,
  currentConfigMap: Map<string, ConfigValue["value"]>,
): ConfigDiff[] {
  const removedFields: ConfigDiff[] = [];

  for (const [fieldName, previousValue] of previousConfigMap) {
    if (!currentConfigMap.has(fieldName)) {
      removedFields.push(createRemovedFieldDiff(fieldName, previousValue));
    }
  }

  return removedFields;
}

/**
 * Creates a diff entry for an added field.
 */
function createAddedFieldDiff(
  fieldName: string,
  newValue: ConfigValue["value"],
): ConfigDiff {
  return {
    name: fieldName,
    newValue,
    type: "added",
  };
}

/**
 * Creates a diff entry for a modified field.
 */
function createModifiedFieldDiff(
  fieldName: string,
  oldValue: ConfigValue["value"],
  newValue: ConfigValue["value"],
): ConfigDiff {
  return {
    name: fieldName,
    oldValue,
    newValue,
    type: "modified",
  };
}

/**
 * Creates a diff entry for a removed field.
 */
function createRemovedFieldDiff(
  fieldName: string,
  oldValue: ConfigValue["value"],
): ConfigDiff {
  return {
    name: fieldName,
    oldValue,
    type: "removed",
  };
}

/**
 * Performs deep equality check for configuration values.
 *
 * Handles primitives, null/undefined, and objects (using JSON comparison).
 *
 * @param firstValue - First value to compare.
 * @param secondValue - Second value to compare.
 * @returns True if values are deeply equal.
 */
function areValuesEqual(firstValue: unknown, secondValue: unknown): boolean {
  if (firstValue === secondValue) {
    return true;
  }

  if (isNullOrUndefined(firstValue) || isNullOrUndefined(secondValue)) {
    return firstValue === secondValue;
  }

  if (typeof firstValue !== typeof secondValue) {
    return false;
  }

  if (areBothObjects(firstValue, secondValue)) {
    return compareObjectsByJson(firstValue, secondValue);
  }

  return false;
}

/**
 * Checks if a value is null or undefined.
 */
function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Checks if both values are objects.
 */
function areBothObjects(a: unknown, b: unknown): boolean {
  return typeof a === "object" && typeof b === "object";
}

/**
 * Compares two objects using JSON serialization.
 *
 * Note: This is a simple comparison method that works for plain objects.
 * For complex objects with methods or circular references, use a dedicated library.
 */
function compareObjectsByJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Applies a diff to a configuration snapshot.
 *
 * @param baseConfiguration - Base configuration to apply diff to.
 * @param changes - Changes to apply.
 * @returns Resulting configuration after applying changes.
 */
export function applyDiff(
  baseConfiguration: ConfigValue[],
  changes: ConfigDiff[],
): ConfigValue[] {
  const configurationMap = createConfigItemMap(baseConfiguration);

  for (const change of changes) {
    applyChangeToMap(configurationMap, change);
  }

  return Array.from(configurationMap.values());
}

/**
 * Creates a map of configuration items by name.
 */
function createConfigItemMap(config: ConfigValue[]): Map<string, ConfigValue> {
  return new Map(config.map((item) => [item.name, item]));
}

/**
 * Applies a single change to the configuration map.
 */
function applyChangeToMap(
  configMap: Map<string, ConfigValue>,
  change: ConfigDiff,
): void {
  if (change.type === "removed") {
    configMap.delete(change.name);
    return;
  }

  const existingConfigItem = configMap.get(change.name);
  const updatedItem = createUpdatedConfigItem(
    change.name,
    change.newValue as ConfigValue["value"],
    existingConfigItem,
  );

  configMap.set(change.name, updatedItem);
}

/**
 * Creates an updated configuration item with new value.
 */
function createUpdatedConfigItem(
  fieldName: string,
  newValue: ConfigValue["value"],
  existingItem?: ConfigValue,
): ConfigValue {
  return {
    name: fieldName,
    value: newValue,
    origin: existingItem?.origin ?? { code: "unknown", level: "unknown" },
  };
}

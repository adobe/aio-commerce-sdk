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

import { readFile, writeFile } from "node:fs/promises";

import { applyEdits, modify } from "jsonc-parser";

import type { JSONPath } from "jsonc-parser";
import type { AsyncFunctionArguments } from "./types.ts";

/** Runs the given action in a safe way and returns the result. */
export function runGitHubScript<T>(
  core: AsyncFunctionArguments["core"],
  action: () => T,
) {
  try {
    return action();
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
    throw error;
  }
}

/** Reads and parses a JSON file. */
export async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf-8")) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type JsonReplacement = { path: JSONPath; value: unknown };

/** Flattens a (possibly nested) replacement value into a list of leaf paths. */
function collectReplacements(
  value: Record<string, unknown>,
  path: JSONPath,
): JsonReplacement[] {
  return Object.entries(value).flatMap(([key, fieldValue]) => {
    const fieldPath = [...path, key];

    return isPlainObject(fieldValue)
      ? collectReplacements(fieldValue, fieldPath)
      : [{ path: fieldPath, value: fieldValue }];
  });
}

/**
 * Replaces the given keys' values in a JSON file, recursing into nested plain
 * objects. Only the matching keys' values change — the rest of the file's
 * existing formatting (indentation, key order, array layout) is preserved,
 * since this edits the source text directly instead of reserializing it.
 */
export async function replaceInJson(
  path: string,
  value: Record<string, unknown>,
) {
  const original = await readFile(path, "utf-8");
  const replacements = collectReplacements(value, []);

  const edits = replacements.flatMap(({ path: fieldPath, value: fieldValue }) =>
    modify(original, fieldPath, fieldValue, {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    }),
  );

  await writeFile(path, applyEdits(original, edits));
}

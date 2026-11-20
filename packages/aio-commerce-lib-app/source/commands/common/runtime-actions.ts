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

import { existsSync } from "node:fs";
import { relative } from "node:path";

import { listExtensionRuntimeActions } from "@aio-commerce-sdk/scripting-utils/aio";

import type { DeclaredRuntimeAction } from "@aio-commerce-sdk/scripting-utils/aio";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Config sections that may reference runtime actions. */
export type CommerceAppConfigReferencingRuntimeActions = Partial<
  Pick<CommerceAppConfigOutputModel, "adminUi" | "eventing" | "webhooks">
>;

/** The extension whose runtime manifest runtime action references must resolve against. */
export type ExtensionManifest = {
  /** The extension point ID, e.g. "commerce/extensibility/1". */
  extensionPointId: string;

  /** Project-relative path of the ext.config.yaml, used in error messages. */
  path: string;

  /** Resolved project root. */
  projectRoot: string;
};

type DeclaredActions = Map<string, DeclaredRuntimeAction>;

type Node = Record<string, unknown>;

/** Sections whose referenced actions must be web actions. */
const WEB_ACTION_SECTIONS = new Set<string>(["webhooks"]);

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A `runtimeAction`/`runtimeActions` value found in the config, with its dotted config path. */
type RuntimeActionReference = { name: string; path: string };

/**
 * Finds every `runtimeAction` and `runtimeActions` value nested in a config value.
 * @param value - The config value to search.
 * @param path - Dotted config path of `value`.
 */
function* findReferences(
  value: unknown,
  path: string,
): Generator<RuntimeActionReference> {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      yield* findReferences(item, `${path}.${index}`);
    }

    return;
  }

  if (!isNode(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (key === "runtimeAction" && typeof child === "string") {
      yield { name: child, path: childPath };
    } else if (key === "runtimeActions" && Array.isArray(child)) {
      for (const [index, name] of child.entries()) {
        if (typeof name === "string") {
          yield { name, path: `${childPath}.${index}` };
        }
      }
    } else {
      yield* findReferences(child, childPath);
    }
  }
}

/**
 * Returns why a reference does not resolve to a usable declared action, or `undefined` if it does.
 * @param name - The referenced `<package>/<action>`.
 * @param declared - Actions the reference may resolve to.
 * @param location - Project-relative path of the ext.config.yaml they are declared in.
 * @param requireWebAction - Whether the referenced action must be a web action.
 * @param projectRoot - Resolved project root, used to report paths relative to it.
 */
function checkReference(
  name: string,
  declared: DeclaredActions,
  location: string,
  requireWebAction: boolean,
  projectRoot: string,
) {
  const action = declared.get(name);

  if (!action) {
    return `Runtime action "${name}" is not declared under "runtimeManifest.packages" in ${location}`;
  }

  const source = relative(projectRoot, action.source);

  if (!(action.function && existsSync(action.function))) {
    return action.function
      ? `Runtime action "${name}" points to "${relative(projectRoot, action.function)}" in ${source}, which does not exist`
      : `Runtime action "${name}" has no "function" in ${source}`;
  }

  if (requireWebAction && !action.isWebAction) {
    return `Runtime action "${name}" must be a web action (set "web: yes" in ${source})`;
  }
}

/**
 * Validates that every `runtimeAction`/`runtimeActions` value in the given config sections is
 * declared in the extension's runtime manifest and that its `function` exists on disk. Webhook actions must
 * also be web actions.
 * @param sections - The config sections whose references are validated.
 * @param manifest - The extension whose runtime manifest the references must resolve against.
 * @throws {Error} If any reference does not resolve to a declared action.
 */
export async function validateRuntimeActionReferences(
  sections: CommerceAppConfigReferencingRuntimeActions,
  manifest: ExtensionManifest,
) {
  const references = Object.entries(sections).flatMap(([section, value]) =>
    [...findReferences(value, section)].map((reference) => ({
      ...reference,
      section,
    })),
  );

  if (references.length === 0) {
    return;
  }

  const declared = await listExtensionRuntimeActions(
    manifest.projectRoot,
    manifest.extensionPointId,
  );

  const errors = references.flatMap(({ name, path, section }) => {
    const message = checkReference(
      name,
      declared,
      manifest.path,
      WEB_ACTION_SECTIONS.has(section),
      manifest.projectRoot,
    );

    return message ? [`${path}: ${message}`] : [];
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid runtime action references in ${manifest.path}:\n- ${errors.join("\n- ")}`,
    );
  }
}

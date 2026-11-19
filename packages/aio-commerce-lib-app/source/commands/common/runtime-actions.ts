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
import { dirname, join, relative, resolve } from "node:path";

import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Config sections that may reference runtime actions. */
export type RuntimeActionSections = Partial<
  Pick<CommerceAppConfigOutputModel, "adminUi" | "eventing" | "webhooks">
>;

/** The ext.config.yaml that runtime action references must resolve against. */
export type ExtensionManifest = {
  /** The parsed ext.config.yaml. */
  config: ExtConfig;

  /** Project-relative path of the ext.config.yaml. */
  path: string;

  /** Resolved project root. */
  projectRoot: string;
};

type DeclaredAction = {
  function: string | undefined;
  functionExists: boolean;
  isWebAction: boolean;
  source: string;
};

type DeclaredActions = Map<string, DeclaredAction>;

type Node = Record<string, unknown>;

/** Values of the `web` action property that expose the action over HTTP. */
const WEB_ACTION_VALUES = new Set<unknown>([true, "yes", "raw"]);

/** Sections whose referenced actions must be web actions. */
const WEB_ACTION_SECTIONS = new Set<string>(["webhooks"]);

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolves a `$include` directive the way App Builder does, returning the merged node and the
 * absolute path of the file it was read from.
 * @param node - The node that may contain a `$include` directive.
 * @param file - Absolute path of the file the node was read from.
 */
async function resolveInclude(
  node: unknown,
  file: string,
): Promise<{ node: Node; file: string }> {
  if (!(isNode(node) && typeof node.$include === "string")) {
    return { file, node: isNode(node) ? node : {} };
  }

  const { $include, ...rest } = node;
  const includedFile = resolve(dirname(file), $include);
  const included = (await readYamlFile(includedFile)).toJS();

  return resolveInclude(
    { ...(isNode(included) ? included : {}), ...rest },
    includedFile,
  );
}

/**
 * Lists the actions of a `runtimeManifest` as `<package>/<action>` entries.
 * @param runtimeManifest - The `runtimeManifest` node, which may use `$include` at any level.
 * @param file - Absolute path of the file the node was read from; `function` paths are relative to it.
 * @param projectRoot - Resolved project root, used to report where each action is declared.
 */
async function listRuntimeManifestActions(
  runtimeManifest: unknown,
  file: string,
  projectRoot: string,
): Promise<[string, DeclaredAction][]> {
  const manifest = await resolveInclude(runtimeManifest, file);
  const packages = await resolveInclude(manifest.node.packages, manifest.file);

  const perPackage = await Promise.all(
    Object.entries(packages.node).map(async ([packageName, pkgNode]) => {
      const pkg = await resolveInclude(pkgNode, packages.file);
      const actions = await resolveInclude(pkg.node.actions, pkg.file);

      return Promise.all(
        Object.entries(actions.node).map(
          async ([actionName, actionNode]): Promise<
            [string, DeclaredAction]
          > => {
            const action = await resolveInclude(actionNode, actions.file);
            const fn =
              typeof action.node.function === "string"
                ? action.node.function
                : "";

            return [
              `${packageName}/${actionName}`,
              {
                function: fn || undefined,
                functionExists:
                  fn !== "" && existsSync(resolve(dirname(action.file), fn)),
                isWebAction: WEB_ACTION_VALUES.has(action.node.web),
                source: relative(projectRoot, action.file),
              },
            ];
          },
        ),
      );
    }),
  );

  return perPackage.flat();
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
 */
function checkReference(
  name: string,
  declared: DeclaredActions,
  location: string,
  requireWebAction: boolean,
) {
  const action = declared.get(name);

  if (!action) {
    return `Runtime action "${name}" is not declared under "runtimeManifest.packages" in ${location}`;
  }

  if (!action.functionExists) {
    return action.function
      ? `Runtime action "${name}" points to "${action.function}" in ${action.source}, which does not exist`
      : `Runtime action "${name}" has no "function" in ${action.source}`;
  }

  if (requireWebAction && !action.isWebAction) {
    return `Runtime action "${name}" must be a web action (set "web: yes" in ${action.source})`;
  }
}

/**
 * Validates that every `runtimeAction`/`runtimeActions` value in the given config sections is
 * declared in the given ext.config.yaml and that its `function` exists on disk. Webhook actions must
 * also be web actions.
 * @param sections - The config sections whose references are validated.
 * @param manifest - The ext.config.yaml the references must resolve against.
 * @throws {Error} If any reference does not resolve to a declared action.
 */
export async function validateRuntimeActionReferences(
  sections: RuntimeActionSections,
  manifest: ExtensionManifest,
) {
  const declared: DeclaredActions = new Map(
    await listRuntimeManifestActions(
      manifest.config.runtimeManifest,
      join(manifest.projectRoot, manifest.path),
      manifest.projectRoot,
    ),
  );

  const errors = Object.entries(sections).flatMap(([section, value]) =>
    [...findReferences(value, section)].flatMap(({ name, path }) => {
      const message = checkReference(
        name,
        declared,
        manifest.path,
        WEB_ACTION_SECTIONS.has(section),
      );

      return message ? [`${path}: ${message}`] : [];
    }),
  );

  if (errors.length > 0) {
    throw new Error(
      `Invalid runtime action references in ${manifest.path}:\n- ${errors.join("\n- ")}`,
    );
  }
}

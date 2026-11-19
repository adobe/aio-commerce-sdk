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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { readYamlFile } from "@aio-commerce-sdk/scripting-utils/yaml";
import * as v from "valibot";

import {
  APP_CONFIG_FILE,
  BACKEND_UI_V2_EXTENSION_POINT_ID,
} from "#commands/constants";
import { getExtConfigPath } from "#commands/utils";
import {
  ADMIN_UI_GRID_COLUMN_ENTITIES,
  ADMIN_UI_MASS_ACTION_ENTITIES,
  ADMIN_UI_VIEW_BUTTON_ENTITIES,
} from "#config/schema/admin-ui";

import type { ExtConfig } from "@aio-commerce-sdk/scripting-utils/yaml";
import type { EXTENSIBILITY_EXTENSION_POINT_ID } from "#commands/constants";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Extension points whose `app.commerce.config` sections reference runtime actions. */
export type RuntimeActionScope =
  | typeof EXTENSIBILITY_EXTENSION_POINT_ID
  | typeof BACKEND_UI_V2_EXTENSION_POINT_ID;

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

/**
 * Lists every action the app deploys: those under `application` and every extension in
 * `app.config.yaml`, following `$include` directives.
 * @param projectRoot - Resolved project root containing `app.config.yaml`.
 */
async function listAppConfigActions(projectRoot: string) {
  const root = await resolveInclude(
    { $include: APP_CONFIG_FILE },
    join(projectRoot, APP_CONFIG_FILE),
  );

  const [application, extensions] = await Promise.all([
    resolveInclude(root.node.application, root.file),
    resolveInclude(root.node.extensions, root.file),
  ]);

  const extensionNodes = await Promise.all(
    Object.values(extensions.node).map((node) =>
      resolveInclude(node, extensions.file),
    ),
  );

  const lists = await Promise.all(
    [application, ...extensionNodes].map(({ node, file }) =>
      listRuntimeManifestActions(node.runtimeManifest, file, projectRoot),
    ),
  );

  return lists.flat();
}

/**
 * Schema for a single runtime action reference, checked against the declared actions.
 * @param declared - Actions the reference may resolve to.
 * @param location - Where those actions are declared, used in error messages.
 * @param requireWebAction - Whether the referenced action must be a web action.
 */
function referenceSchema(
  declared: DeclaredActions,
  location: string,
  requireWebAction = false,
) {
  return v.pipe(
    v.string(),
    v.check(
      (name) => declared.has(name),
      (issue) =>
        `Runtime action "${issue.input}" is not declared under "runtimeManifest.packages" in ${location}`,
    ),
    v.check(
      (name) => declared.get(name)?.functionExists !== false,
      (issue) => {
        const action = declared.get(issue.input as string);
        return action?.function
          ? `Runtime action "${issue.input}" points to "${action.function}" in ${action.source}, which does not exist`
          : `Runtime action "${issue.input}" has no "function" in ${action?.source}`;
      },
    ),
    v.check(
      (name) => !requireWebAction || declared.get(name)?.isWebAction !== false,
      (issue) =>
        `Runtime action "${issue.input}" must be a web action (set "web: yes" in ${declared.get(issue.input as string)?.source})`,
    ),
  );
}

/**
 * Schema mirroring the `adminUi` fields that reference `workerProcess` runtime actions.
 * @param ref - Schema for a single runtime action reference.
 */
function adminUiReferencesSchema(ref: v.GenericSchema<string>) {
  const workerEntries = v.optional(
    v.array(v.looseObject({ runtimeAction: v.optional(ref) })),
  );

  const entities = new Set([
    ...ADMIN_UI_GRID_COLUMN_ENTITIES,
    ...ADMIN_UI_MASS_ACTION_ENTITIES,
    ...ADMIN_UI_VIEW_BUTTON_ENTITIES,
  ]);

  const entitySchema = v.optional(
    v.looseObject({
      gridColumns: v.optional(v.looseObject({ runtimeAction: ref })),
      massActions: workerEntries,
      viewButtons: workerEntries,
    }),
  );

  return v.looseObject({
    adminUi: v.optional(
      v.looseObject(
        Object.fromEntries([...entities].map((key) => [key, entitySchema])),
      ),
    ),
  });
}

/**
 * Schema mirroring the `eventing` and `webhooks` fields that reference runtime actions.
 * @param ref - Schema for a single runtime action reference.
 * @param webRef - Schema for a runtime action reference that must be a web action.
 */
function extensibilityReferencesSchema(
  ref: v.GenericSchema<string>,
  webRef: v.GenericSchema<string>,
) {
  const eventSources = v.optional(
    v.array(
      v.looseObject({
        events: v.array(v.looseObject({ runtimeActions: v.array(ref) })),
      }),
    ),
  );

  return v.looseObject({
    eventing: v.optional(
      v.looseObject({ commerce: eventSources, external: eventSources }),
    ),
    webhooks: v.optional(
      v.array(v.looseObject({ runtimeAction: v.optional(webRef) })),
    ),
  });
}

/**
 * Validates that every runtime action referenced by the config sections owned by an extension point
 * resolves to a declared action whose `function` exists on disk. `adminUi` actions must be declared in
 * the `commerce/backend-ui/2` extension config; `eventing` and `webhooks` actions may be declared under
 * `application` or any extension in `app.config.yaml`, and webhook actions must be web actions.
 * @param appConfig - The validated app configuration.
 * @param extensionPointId - The extension point whose references are validated.
 * @param extConfig - The extension point's parsed ext.config.yaml.
 * @param projectRoot - Resolved project root containing the extension config.
 * @throws {CommerceSdkValidationError} If any reference does not resolve to a declared action.
 */
export async function validateRuntimeActionReferences(
  appConfig: CommerceAppConfigOutputModel,
  extensionPointId: RuntimeActionScope,
  extConfig: ExtConfig,
  projectRoot: string,
) {
  const extConfigPath = getExtConfigPath(extensionPointId);
  const declared: DeclaredActions = new Map(
    await listRuntimeManifestActions(
      extConfig.runtimeManifest,
      join(projectRoot, extConfigPath),
      projectRoot,
    ),
  );

  let schema: v.GenericSchema;
  if (extensionPointId === BACKEND_UI_V2_EXTENSION_POINT_ID) {
    schema = adminUiReferencesSchema(referenceSchema(declared, extConfigPath));
  } else {
    for (const [name, action] of await listAppConfigActions(projectRoot)) {
      if (!declared.has(name)) {
        declared.set(name, action);
      }
    }
    const location = `${APP_CONFIG_FILE} or any of its extensions`;
    schema = extensibilityReferencesSchema(
      referenceSchema(declared, location),
      referenceSchema(declared, location, true),
    );
  }

  const result = v.safeParse(schema, appConfig);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      `Invalid runtime action references for ${extensionPointId}`,
      { issues: result.issues },
    );
  }
}

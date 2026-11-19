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
import { join, resolve } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import {
  BACKEND_UI_V2_EXTENSION_POINT_ID,
  getExtensionPointFolderPath,
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
};

type DeclaredActions = Map<string, DeclaredAction>;

/** Values of the `web` action property that expose the action over HTTP. */
const WEB_ACTION_VALUES = new Set<unknown>([true, "yes", "raw"]);

/**
 * Indexes the actions declared in an ext.config.yaml `runtimeManifest` by `<package>/<action>`.
 * @param extConfig - The parsed ext.config.yaml.
 * @param extConfigDir - Absolute directory of the ext.config.yaml, which `function` paths are relative to.
 */
function getDeclaredActions(
  extConfig: ExtConfig,
  extConfigDir: string,
): DeclaredActions {
  const declared: DeclaredActions = new Map();
  const packages = Object.entries(extConfig.runtimeManifest?.packages ?? {});

  for (const [packageName, { actions = {} }] of packages) {
    for (const [actionName, action] of Object.entries(actions)) {
      const fn = typeof action?.function === "string" ? action.function : "";
      declared.set(`${packageName}/${actionName}`, {
        function: fn || undefined,
        functionExists: fn !== "" && existsSync(resolve(extConfigDir, fn)),
        isWebAction: WEB_ACTION_VALUES.has(action?.web),
      });
    }
  }

  return declared;
}

/**
 * Schema for a single runtime action reference, checked against the declared actions.
 * @param declared - Actions declared in the scope's ext.config.yaml.
 * @param extConfigPath - Project-relative path of that ext.config.yaml, used in error messages.
 * @param requireWebAction - Whether the referenced action must be a web action.
 */
function referenceSchema(
  declared: DeclaredActions,
  extConfigPath: string,
  requireWebAction = false,
) {
  return v.pipe(
    v.string(),
    v.check(
      (name) => declared.has(name),
      (issue) =>
        `Runtime action "${issue.input}" is not declared under "runtimeManifest.packages" in ${extConfigPath}`,
    ),
    v.check(
      (name) => declared.get(name)?.functionExists !== false,
      (issue) => {
        const fn = declared.get(issue.input as string)?.function;
        return fn
          ? `Runtime action "${issue.input}" points to "${fn}" in ${extConfigPath}, which does not exist`
          : `Runtime action "${issue.input}" has no "function" in ${extConfigPath}`;
      },
    ),
    v.check(
      (name) => !requireWebAction || declared.get(name)?.isWebAction !== false,
      (issue) =>
        `Runtime action "${issue.input}" must be a web action (set "web: yes" in ${extConfigPath})`,
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
 * is declared in that extension point's ext.config.yaml and that its `function` exists on disk.
 * @param appConfig - The validated app configuration.
 * @param extensionPointId - The extension point whose references are validated.
 * @param extConfig - The extension point's parsed ext.config.yaml.
 * @param projectRoot - Resolved project root containing the extension config.
 * @throws {CommerceSdkValidationError} If any reference does not resolve to a declared action.
 */
export function validateRuntimeActionReferences(
  appConfig: CommerceAppConfigOutputModel,
  extensionPointId: RuntimeActionScope,
  extConfig: ExtConfig,
  projectRoot: string,
) {
  const extConfigPath = getExtConfigPath(extensionPointId);
  const declared = getDeclaredActions(
    extConfig,
    join(projectRoot, getExtensionPointFolderPath(extensionPointId)),
  );

  const ref = referenceSchema(declared, extConfigPath);
  const schema =
    extensionPointId === BACKEND_UI_V2_EXTENSION_POINT_ID
      ? adminUiReferencesSchema(ref)
      : extensibilityReferencesSchema(
          ref,
          referenceSchema(declared, extConfigPath, true),
        );

  const result = v.safeParse(schema, appConfig);
  if (!result.success) {
    throw new CommerceSdkValidationError(
      `Invalid runtime action references for ${extensionPointId}`,
      { issues: result.issues },
    );
  }
}

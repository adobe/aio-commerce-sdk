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

import { CommerceEnvSchema } from "@adobe/aio-commerce-lib-core/commerce";
import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

/** Schema for validating the Adobe I/O app credentials used across lifecycle workflows. */
export const AppDataSchema = v.object({
  consumerOrgId: nonEmptyStringValueSchema("consumerOrgId"),
  orgName: nonEmptyStringValueSchema("orgName"),
  projectId: nonEmptyStringValueSchema("projectId"),
  projectName: nonEmptyStringValueSchema("projectName"),
  projectTitle: nonEmptyStringValueSchema("projectTitle"),
  workspaceId: nonEmptyStringValueSchema("workspaceId"),
  workspaceName: nonEmptyStringValueSchema("workspaceName"),
  workspaceTitle: nonEmptyStringValueSchema("workspaceTitle"),
});

/** Type for Adobe I/O app credentials. */
export type AppData = v.InferOutput<typeof AppDataSchema>;

/**
 * Schema for the request body shared by lifecycle runtime actions
 * (installation, uninstallation, and upgrade).
 */
export const LifecycleRequestContextSchema = v.object({
  appData: AppDataSchema,

  // The Commerce instance the service sends on every lifecycle call. Nullish because the service
  // may serialize a missing value as null. Only used to uninstall an app that has no association
  // record.
  commerceBaseUrl: v.nullish(
    v.pipe(
      v.string(),
      v.url(
        "The 'commerceBaseUrl' field must be a valid absolute URL (e.g., 'https://my-store.example.com')",
      ),
    ),
  ),
  commerceEnv: v.nullish(CommerceEnvSchema),

  // Set with `installedVersion` when the app is installed with only business configuration, so it
  // has no lifecycle baseline. Planning then resolves an upgrade instead of an install. Ignored
  // when a baseline exists.
  installedState: v.optional(v.literal("business-config-only")),

  // The version the service stored for the installed app. The plan's source version when
  // `installedState` is set.
  installedVersion: v.optional(v.string()),
  ioEventsEnv: v.string(),
  ioEventsUrl: v.string(),

  // Plans an uninstall instead of the install or upgrade the installed state calls for.
  operation: v.optional(v.literal("uninstall")),

  // The id of the pending plan to start. Required to start any operation.
  planId: v.optional(v.string()),
});

/** The request context passed to lifecycle runtime actions. */
export type LifecycleRequestContext = v.InferOutput<
  typeof LifecycleRequestContextSchema
>;

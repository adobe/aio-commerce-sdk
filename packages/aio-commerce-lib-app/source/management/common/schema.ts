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

  // Optional because an upgrade derives the Commerce instance from the existing
  // association; install and uninstall read these from the body and guard them.
  commerceBaseUrl: v.optional(v.string()),
  commerceEnv: v.optional(CommerceEnvSchema),

  ioEventsEnv: v.string(),
  ioEventsUrl: v.string(),
});

/** The request context passed to lifecycle runtime actions. */
export type LifecycleRequestContext = v.InferOutput<
  typeof LifecycleRequestContextSchema
>;

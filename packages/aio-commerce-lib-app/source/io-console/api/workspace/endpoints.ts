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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import { DownloadWorkspaceJsonParamsSchema } from "#io-console/api/workspace/schema";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { Options } from "@adobe/aio-commerce-lib-api/ky";
import type { DownloadWorkspaceJsonParams } from "#io-console/api/workspace/schema";

/**
 * Parses the input using the provided schema and throws a {@link CommerceSdkValidationError} error if the input is invalid. TODO: Move to core
 * @param schema - The schema to use for parsing.
 * @param input - The input to parse.
 */
function parseOrThrow<
  const TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(schema: TSchema, input: unknown): v.InferOutput<TSchema> {
  const result = v.safeParse(schema, input);
  if (!result.success) {
    throw new CommerceSdkValidationError("Invalid input", {
      issues: result.issues,
    });
  }

  return result.output;
}

/**
 * Downloads the workspace JSON for the given organization, project, and workspace IDs.
 * @see <Internal documentation>
 *
 * @param httpClient
 * @param params
 * @param fetchOptions
 */
// biome-ignore lint/suspicious/useAwait: We want to always return a promise
export async function downloadWorkspaceJson(
  httpClient: AdobeIoEventsHttpClient,
  params: DownloadWorkspaceJsonParams,
  fetchOptions?: Options,
) {
  const { orgId, projectId, workspaceId } = parseOrThrow(
    DownloadWorkspaceJsonParamsSchema,
    params,
  );

  const withHooksClient = httpClient.extend({
    hooks: {
      afterResponse: [],
    },
  });

  return withHooksClient.get(
    `console/organizations/${orgId}/projects/${projectId}/workspaces/${workspaceId}/download`,
    fetchOptions,
  );
}

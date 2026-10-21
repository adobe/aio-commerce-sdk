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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import { CamsClientError } from "#commands/common/cams/errors";
import { withCommerceInstance } from "#commands/common/cams/http-client";
import {
  AttemptStatusSchema,
  ExtensionListSchema,
  ExtensionParamsSchema,
  FindAttemptParamsSchema,
  FindExtensionParamsSchema,
  StartUpgradeParamsSchema,
  UpgradePlanAnswerSchema,
} from "#commands/common/cams/schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError, Options, ResponsePromise } from "ky";
import type {
  CamsHttpClient,
  CamsRequestOptions,
} from "#commands/common/cams/http-client";
import type {
  ExtensionParams,
  FindAttemptParams,
  FindExtensionParams,
  StartUpgradeParams,
} from "#commands/common/cams/schema";

/** The path of the upgrades of an extension, relative to the base URL. */
function upgradesPath(extensionId: string) {
  return `v1/extensions/${encodeURIComponent(extensionId)}/upgrades`;
}

/**
 * Reads the JSON body of an answer and checks it against the schema.
 * @throws A {@link CamsClientError} If the body is not JSON or does not match the schema.
 */
async function parseBody<TSchema extends v.GenericSchema, TBody = unknown>(
  schema: TSchema,
  body: TBody,
): Promise<v.InferOutput<TSchema>> {
  const parsed = v.safeParse(schema, body);

  if (!parsed.success) {
    throw new CamsClientError(
      "The Commerce App Management Service sent an unexpected answer",
      { cause: new v.ValiError(parsed.issues) },
    );
  }

  return parsed.output;
}

/**
 * Reads the JSON body of a response and checks it against the schema.
 * @throws A {@link CamsClientError} If the body is not JSON or does not match the schema.
 */
async function readAndParseBody<TSchema extends v.GenericSchema>(
  schema: TSchema,
  request: ResponsePromise | Response,
): Promise<v.InferOutput<TSchema>> {
  const response = await request;
  try {
    return parseBody(schema, await response.json());
  } catch (error) {
    throw new CamsClientError(
      "The Commerce App Management Service sent an answer that is not JSON",
      { cause: error },
    );
  }
}

/**
 * Finds the extension associated with a workspace.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The workspace to look the extension up by.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @returns The extension, or `null` when the workspace is not associated.
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function findExtension(
  httpClient: CamsHttpClient,
  params: FindExtensionParams,
  fetchOptions?: Options,
) {
  const { workspaceId } = parseOrThrow(FindExtensionParamsSchema, params);

  const [extension] = await readAndParseBody(
    ExtensionListSchema,
    httpClient.get(
      `v1/workspaces/${encodeURIComponent(workspaceId)}/extensions`,
      fetchOptions,
    ),
  );

  return extension ?? null;
}

/**
 * Asks CAMS to plan an upgrade of the extension.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The extension to plan the upgrade for.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function planUpgrade(
  httpClient: CamsHttpClient,
  params: ExtensionParams,
  fetchOptions?: CamsRequestOptions,
) {
  const { extensionId } = parseOrThrow(ExtensionParamsSchema, params);
  const { plan } = await readAndParseBody(
    UpgradePlanAnswerSchema,
    httpClient.post(
      `${upgradesPath(extensionId)}/preview`,
      withCommerceInstance(httpClient, fetchOptions),
    ),
  );

  return plan;
}

/**
 * Starts the planned upgrade.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The extension and the plan to start.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @returns The status of the new attempt.
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function startUpgrade(
  httpClient: CamsHttpClient,
  params: StartUpgradeParams,
  fetchOptions?: CamsRequestOptions,
) {
  const { extensionId, planId } = parseOrThrow(
    StartUpgradeParamsSchema,
    params,
  );

  return await readAndParseBody(
    AttemptStatusSchema,
    httpClient.post(upgradesPath(extensionId), {
      ...withCommerceInstance(httpClient, fetchOptions),
      json: { planId },
    }),
  );
}

/**
 * Reads the status of an attempt once.
 *
 * The request is not retried, because the polling loop is the retry.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The extension and the attempt to read.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function pollUpgrade(
  httpClient: CamsHttpClient,
  params: FindAttemptParams,
  fetchOptions?: CamsRequestOptions,
) {
  const { extensionId, runId } = parseOrThrow(FindAttemptParamsSchema, params);
  const attemptStatus = await readAndParseBody(
    AttemptStatusSchema,
    httpClient.post(
      `${upgradesPath(extensionId)}/${encodeURIComponent(runId)}/sync`,
      { ...withCommerceInstance(httpClient, fetchOptions), retry: 0 },
    ),
  );

  return attemptStatus;
}

/**
 * Reads the latest upgrade attempt without changing anything. Attempts that ran another operation
 * do not count.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The extension to read the latest attempt of.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @returns The attempt, or `null` when there is none.
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function readUpgrade(
  httpClient: CamsHttpClient,
  params: FindAttemptParams,
  fetchOptions?: CamsRequestOptions,
) {
  const { extensionId, runId } = parseOrThrow(FindAttemptParamsSchema, params);
  return await readAndParseBody(
    AttemptStatusSchema,
    httpClient.get(
      `${upgradesPath(extensionId)}/${encodeURIComponent(runId)}`,
      withCommerceInstance(httpClient, fetchOptions),
    ),
  );
}

/**
 * Reads the latest upgrade attempt without changing anything. Attempts that ran another operation
 * do not count.
 *
 * @param httpClient - The {@link CamsHttpClient} to use to make the request.
 * @param params - The extension to read the latest attempt of.
 * @param fetchOptions - The {@link Options} to use to make the request.
 *
 * @returns The attempt, or `null` when there is none.
 * @throws A {@link CommerceSdkValidationError} If the parameters are in the wrong format.
 * @throws An {@link HTTPError} If the status code is not 2XX.
 */
export async function readLatestUpgrade(
  httpClient: CamsHttpClient,
  params: ExtensionParams,
  fetchOptions?: CamsRequestOptions,
) {
  const { extensionId } = parseOrThrow(ExtensionParamsSchema, params);
  const response = await httpClient.get(
    upgradesPath(extensionId),
    withCommerceInstance(httpClient, fetchOptions),
  );
  if (response.status === 204) {
    return null;
  }

  return await readAndParseBody(AttemptStatusSchema, response);
}

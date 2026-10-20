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

import { decodeCommerceInstance } from "#commands/common/cams/commerce-instance";
import { CamsClientError } from "#commands/common/cams/errors";
import {
  AttemptStatusSchema,
  ExtensionListSchema,
  ExtensionParamsSchema,
  FindExtensionParamsSchema,
  LatestAttemptSchema,
  PollUpgradeParamsSchema,
  UpgradePlanAnswerSchema,
} from "#commands/common/cams/schema";

import type { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError, Options, ResponsePromise } from "ky";
import type { CamsHttpClient } from "#commands/common/cams/http-client";
import type {
  ExtensionParams,
  FindExtensionParams,
  PollUpgradeParams,
} from "#commands/common/cams/schema";

/** Limits a read of an attempt to the attempts that ran an upgrade. */
const UPGRADE_QUERY = { operation: "upgrade" };

/** The path of the upgrades of an extension, relative to the base URL. */
function upgradesPath(extensionId: string) {
  return `v1/extensions/${encodeURIComponent(extensionId)}/upgrades`;
}

/**
 * Reads the JSON body of an answer and checks it against the schema.
 * @throws A {@link CamsClientError} If the body is not JSON or does not match the schema.
 */
async function readJson<TSchema extends v.GenericSchema>(
  schema: TSchema,
  request: ResponsePromise,
): Promise<v.InferOutput<TSchema>> {
  const response = await request;

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new CamsClientError(
      "The Commerce App Management Service sent an answer that is not JSON",
      { cause: error },
    );
  }

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

  const [extension] = await readJson(
    ExtensionListSchema,
    httpClient.get(
      `v1/workspaces/${encodeURIComponent(workspaceId)}/extensions`,
      fetchOptions,
    ),
  );

  // Prefer decoded fields; older service versions only return commerceId.
  const scope = extension?.scope;
  const commerceInstance =
    scope?.commerceBaseUrl && scope.commerceEnv
      ? { env: scope.commerceEnv, url: scope.commerceBaseUrl }
      : decodeCommerceInstance(scope?.commerceId);
  httpClient.setCommerceInstance(commerceInstance);

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
  fetchOptions?: Options,
) {
  const { extensionId } = parseOrThrow(ExtensionParamsSchema, params);
  const { plan } = await readJson(
    UpgradePlanAnswerSchema,
    httpClient.post(`${upgradesPath(extensionId)}/preview`, fetchOptions),
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
  params: ExtensionParams,
  fetchOptions?: Options,
) {
  const { extensionId } = parseOrThrow(ExtensionParamsSchema, params);

  return await readJson(
    AttemptStatusSchema,
    httpClient.post(`${upgradesPath(extensionId)}:start`, fetchOptions),
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
  params: PollUpgradeParams,
  fetchOptions?: Options,
) {
  const { extensionId, runId } = parseOrThrow(PollUpgradeParamsSchema, params);

  return await readJson(
    AttemptStatusSchema,
    httpClient.get(
      `${upgradesPath(extensionId)}/${encodeURIComponent(runId)}`,
      { ...fetchOptions, retry: 0 },
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
  fetchOptions?: Options,
) {
  const { extensionId } = parseOrThrow(ExtensionParamsSchema, params);
  const request = httpClient.get(upgradesPath(extensionId), {
    ...fetchOptions,
    searchParams: { ...UPGRADE_QUERY, limit: "1" },
  });
  const response = await request;
  if (response.status === 204) {
    return null;
  }

  const latest = await readJson(LatestAttemptSchema, request);
  return latest ?? null;
}

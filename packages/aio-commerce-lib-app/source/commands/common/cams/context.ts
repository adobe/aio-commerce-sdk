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

import {
  getAioCliEnv,
  getAioProjectContext,
  getUserToken,
} from "@aio-commerce-sdk/scripting-utils/aio";

import {
  createCamsInstanceClient,
  createCamsWorkspaceClient,
} from "#commands/common/cams/api-client";
import { resolveCamsBaseUrl } from "#commands/common/cams/config";
import { CamsClientError } from "#commands/common/cams/errors";

import type { Options } from "ky";
import type {
  CamsInstanceClient,
  CamsWorkspaceClient,
} from "#commands/common/cams/api-client";
import type { Extension } from "#commands/common/cams/schema";
import type { AssociatedCommerceData } from "#management/association/types";

/** What a command needs to talk to CAMS about the current workspace. */
export type CamsContext = {
  createWorkspaceClient: () => CamsWorkspaceClient;
  createInstanceClient: (
    commerceInstance: AssociatedCommerceData,
  ) => CamsInstanceClient;
  baseUrl: string;
  project: ReturnType<typeof getAioProjectContext>["project"];
};

/**
 * Reads the current App Builder project and supplies lazy CAMS client factories.
 * @param getToken - Reads the user token before every request. Defaults to the AIO CLI token.
 */
export function createCamsContext(
  getToken: () => Promise<string> = getUserToken,
): CamsContext {
  const { project } = getAioProjectContext();
  const baseUrl = resolveCamsBaseUrl(getAioCliEnv());
  const params = {
    auth: { getToken, org: project.org },
    config: { baseUrl },
  };

  return {
    baseUrl,
    createInstanceClient: (commerceInstance) =>
      createCamsInstanceClient(params, commerceInstance),
    createWorkspaceClient: () => createCamsWorkspaceClient(params),
    project,
  };
}

/** Finds the extension associated with the current workspace without changing the context. */
export async function findWorkspaceExtension(
  context: CamsContext,
  fetchOptions?: Options,
) {
  return await context
    .createWorkspaceClient()
    .findExtension({ workspaceId: context.project.workspace.id }, fetchOptions);
}

/**
 * Reads the Commerce instance from an extension's explicit scope fields.
 * @throws A {@link CamsClientError} If the extension or its Commerce instance is missing.
 */
export function requireCommerceInstance(
  extension: Extension | null,
): AssociatedCommerceData {
  if (!extension) {
    throw new CamsClientError(
      "This workspace is not associated with an app extension.",
    );
  }

  const { scope } = extension;
  if (!(scope?.commerceBaseUrl && scope.commerceEnv)) {
    throw new CamsClientError(
      `The extension "${extension.id}" has no Commerce instance configuration.`,
    );
  }

  return { baseUrl: scope.commerceBaseUrl, env: scope.commerceEnv };
}

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

import { createCamsClient } from "#commands/common/cams/api-client";
import { resolveCamsBaseUrl } from "#commands/common/cams/config";

import type { CamsClient } from "#commands/common/cams/api-client";
import type { Extension } from "#commands/common/cams/schema";
import type { AssociatedCommerceData } from "#management/association/types";

/** What a command needs to talk to CAMS about the current workspace. */
export type CamsContext = {
  client: CamsClient;
  createClient: (commerceInstance?: AssociatedCommerceData) => CamsClient;
  baseUrl: string;
  project: ReturnType<typeof getAioProjectContext>["project"];
};

/**
 * Reads the current App Builder project and creates the CAMS client for it.
 * @param getToken - Reads the user token before every request. Defaults to the AIO CLI token.
 */
export function createCamsContext(
  getToken: () => Promise<string> = getUserToken,
): CamsContext {
  const { project } = getAioProjectContext();
  const baseUrl = resolveCamsBaseUrl(getAioCliEnv());
  const auth = { getToken, org: project.org };
  const createClient = (commerceInstance?: AssociatedCommerceData) =>
    createCamsClient({
      auth,
      config: { baseUrl, commerceInstance },
    });

  return {
    baseUrl,
    client: createClient(),
    createClient,
    project,
  };
}

/** Rebuilds the context client with the Commerce instance returned by CAMS. */
export function configureCamsContext(
  context: CamsContext,
  extension: Extension | null,
) {
  const scope = extension?.scope;
  const commerceInstance =
    scope?.commerceBaseUrl && scope.commerceEnv
      ? { baseUrl: scope.commerceBaseUrl, env: scope.commerceEnv }
      : undefined;

  context.client = context.createClient(commerceInstance);
}

/**
 * Finds the id of the extension associated with the current workspace.
 * @param context - The CAMS context containing the current workspace and client.
 * @returns The extension id, or `null` when the workspace is not associated.
 */
export async function findWorkspaceExtensionId(context: CamsContext) {
  const extension = await context.client.findExtension({
    workspaceId: context.project.workspace.id,
  });
  configureCamsContext(context, extension);

  return extension?.id ?? null;
}

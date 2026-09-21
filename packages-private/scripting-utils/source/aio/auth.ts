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

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import aioIms from "@adobe/aio-lib-ims";

const { context, getToken } = aioIms;

/** A workspace credential entry from the local AIO CLI config. */
type WorkspaceCredential = {
  integration_type: string;
  name: string;
};

/** Gets an IMS access token for the current CLI IMS context. */
export async function getUserToken(): Promise<string> {
  const contextName = (await context.getCurrent()) ?? "cli";
  return getToken(contextName, {});
}

/**
 * Resolves the IMS context name of the workspace OAuth server-to-server
 * (technical account) credential, or `null` when the workspace has none.
 */
function resolveServiceContextName(): string | null {
  const credentials = (config.get("project.workspace.details.credentials") ??
    []) as WorkspaceCredential[];

  const [name] = credentials
    .filter(
      ({ integration_type }) => integration_type === "oauth_server_to_server",
    )
    .map((credential) => credential.name);

  return name ?? null;
}

/**
 * Gets an IMS access token for the workspace OAuth server-to-server (technical
 * account) credential. Use this when a flow with no user in the loop — such as
 * the post-deploy upgrade notification — must authenticate as the app itself
 * rather than the developer running the CLI.
 * @throws If the workspace has no OAuth server-to-server credential configured.
 */
export async function getServiceToken(): Promise<string> {
  const contextName = resolveServiceContextName();
  if (!contextName) {
    throw new Error(
      "No OAuth server-to-server credential is configured for this workspace. " +
        "Add an OAuth server-to-server credential to the workspace and run `aio app use` to sync it.",
    );
  }

  return await getToken(contextName, {});
}

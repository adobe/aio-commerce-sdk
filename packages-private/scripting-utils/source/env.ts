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

/**
 * This module exports shared environment utilities for the AIO Commerce SDK.
 * @packageDocumentation
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import aioIms from "@adobe/aio-lib-ims";
import dotenv from "dotenv";

import { getProjectRootDirectory } from "#project";

const { context } = aioIms;
const IMS_KEYS = {
  client_id: "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  client_secrets: "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  ims_org_id: "AIO_COMMERCE_AUTH_IMS_ORG_ID",
  scopes: "AIO_COMMERCE_AUTH_IMS_SCOPES",
  technical_account_email: "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  technical_account_id: "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
} as const;

type WorkspaceCredentials = {
  integration_type: string;
  name: string;
};

type ImsContextKey = keyof typeof IMS_KEYS;
type ImsContext = {
  name: string;
  data: Record<ImsContextKey, string>;
};

/**
 * Replaces or creates an environment variable in a .env file
 * @param filePath - The path to the .env file
 * @param key - The environment variable key to replace or create
 * @param value - The new value for the environment variable
 */
export function replaceEnvVar(filePath: string, key: string, value: string) {
  const envPath = path.resolve(filePath);
  const envFile = readFileSync(envPath, "utf8");
  const envLines = envFile.split("\n");

  const formattedValue = value.includes(" ") ? `"${value}"` : value;
  let keyExists = false;

  const updatedLines = envLines.map((line) => {
    if (line.trim().startsWith("#") || !line.includes("=")) {
      return line;
    }

    const [currentKey] = line.split("=");
    if (currentKey === key) {
      keyExists = true;
      return `${key}=${formattedValue}`;
    }
    return line;
  });

  if (!keyExists) {
    updatedLines.push(`${key}=${formattedValue}`);
  }

  writeFileSync(envPath, updatedLines.join("\n"), "utf8");
}

/**
 * Returns the path to the project's `.env` file, resolved from the project root
 * (the nearest `package.json` walking up from `cwd`), so it is found regardless
 * of which subdirectory a command is invoked from.
 * @param cwd - A directory within the project. Defaults to the current working directory.
 */
async function resolveEnvPath(cwd = process.cwd()) {
  const projectRoot = await getProjectRootDirectory(cwd);
  return path.join(projectRoot, ".env");
}

/**
 * Sets the `NODE_ENV` environment variable in the app `.env` file, so the web
 * bundler (Parcel) ships the matching React build. Creates the `.env` if absent.
 * @param mode - The environment mode to write into `NODE_ENV`.
 * @param cwd - A directory within the project. Defaults to the current working directory.
 */
export async function setNodeEnv(
  mode: "development" | "production",
  cwd = process.cwd(),
) {
  const envPath = await resolveEnvPath(cwd);
  if (!existsSync(envPath)) {
    writeFileSync(envPath, "", "utf8");
  }
  replaceEnvVar(envPath, "NODE_ENV", mode);
}

/** Resolves the IMS server to server context from the project workspace credentials. */
function resolveImsS2SContext(): Promise<ImsContext | null> {
  const credentials: WorkspaceCredentials[] =
    config.get("project.workspace.details.credentials") ?? [];

  const [credential] = credentials
    .filter(
      ({ integration_type }) => integration_type === "oauth_server_to_server",
    )
    .map(({ name }) => name);

  if (!credential) {
    return Promise.resolve(null);
  }

  return context.get(credential);
}

export type SyncImsCredentialsResult =
  | { ok: true }
  | { ok: false; reason: "missing-env" | "no-ims-context" };

/**
 * Syncs the IMS credentials environment variables from the configured IMS context in
 * the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`.
 * @param cwd - A directory within the project. Defaults to the current working directory.
 */
export async function syncImsCredentials(
  cwd = process.cwd(),
): Promise<SyncImsCredentialsResult> {
  const envPath = await resolveEnvPath(cwd);

  if (!existsSync(envPath)) {
    return { ok: false, reason: "missing-env" };
  }

  const envVars = dotenv.parse(readFileSync(envPath, "utf8"));
  const imsContext = await resolveImsS2SContext();

  if (!imsContext) {
    return { ok: false, reason: "no-ims-context" };
  }

  const { data } = imsContext;

  for (const [key, value] of Object.entries(data)) {
    const oauthKey = IMS_KEYS[key as ImsContextKey];
    if (!oauthKey) {
      continue;
    }

    if (!envVars[oauthKey] || envVars[oauthKey] !== value) {
      replaceEnvVar(envPath, oauthKey, value);
    }
  }

  return { ok: true };
}

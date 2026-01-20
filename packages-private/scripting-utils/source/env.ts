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

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import aioIms from "@adobe/aio-lib-ims";
import dotenv from "dotenv";

const { context } = aioIms;
const IMS_KEYS = {
  client_id: "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  client_secrets: "AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  technical_account_email: "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  technical_account_id: "AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  scopes: "AIO_COMMERCE_AUTH_IMS_SCOPES",
  ims_org_id: "AIO_COMMERCE_AUTH_IMS_ORG_ID",
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
function replaceEnvVar(filePath: string, key: string, value: string) {
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

/** Returns the path to the .env file. */
function resolveEnvPath() {
  const envPath = process.env.INIT_CWD
    ? `${process.env.INIT_CWD}/.env`
    : ".env";

  return path.resolve(envPath);
}

/** Resolves the IMS server to server context from the project workspace credentials. */
function resolveImsS2SContext(): Promise<ImsContext | null> {
  const credentials: WorkspaceCredentials[] =
    config.get("project.workspace.details.credentials") ?? [];

  const [credential] =
    credentials
      .filter(
        ({ integration_type }) => integration_type === "oauth_server_to_server",
      )
      .map(({ name }) => name) ?? [];

  if (!credential) {
    return Promise.resolve(null);
  }

  return context.get(credential);
}

/**
 * Syncs the IMS credentials environment variables from the configured IMS context in
 * the .env file, in a way that is compatible with `@adobe/aio-commerce-lib-auth`
 */
export async function syncImsCredentials() {
  const envPath = resolveEnvPath();
  const envVars = dotenv.parse(readFileSync(envPath, "utf8"));
  const imsContext = await resolveImsS2SContext();

  if (!imsContext) {
    return;
  }

  const { data } = imsContext;

  for (const [key, value] of Object.entries(data)) {
    const oauthKey = IMS_KEYS[key as ImsContextKey];
    if (!oauthKey) {
      continue;
    }

    if (!envVars[oauthKey]) {
      replaceEnvVar(envPath, oauthKey, value);
    } else if (envVars[oauthKey] !== value) {
      replaceEnvVar(envPath, oauthKey, value);
    }
  }
}

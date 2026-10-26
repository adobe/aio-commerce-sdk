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

declare module "@adobe/aio-commerce-lib-app/management" {
  type InstallationConfig = {
    metadata: { displayName: string };
  };
  type InstallationContext = {
    logger: {
      error: (...values: unknown[]) => void;
      info: (...values: unknown[]) => void;
      warn: (...values: unknown[]) => void;
    };
    params: Record<string, unknown>;
  };
  type InstallationStep = {
    install: (
      config: InstallationConfig,
      context: InstallationContext,
    ) => Promise<unknown>;
    uninstall?: (
      config: InstallationConfig,
      context: InstallationContext,
    ) => unknown;
  };
  export function defineCustomInstallationStep<T extends InstallationStep>(
    step: T,
  ): T;
}

declare module "@adobe/aio-commerce-lib-auth" {
  type ImsAuthParams = Record<string, unknown>;
  export function getImsAuthProvider(params: ImsAuthParams): {
    getAccessToken: () => Promise<string>;
  };
  export function resolveImsAuthParams(
    params: Record<string, unknown>,
  ): ImsAuthParams;
}

declare module "@adobe/aio-commerce-lib-core/responses" {
  export function buildErrorResponse(
    statusCode: number,
    options: { body: Record<string, unknown> },
  ): unknown;
  export function ok(options: { body: Record<string, unknown> }): unknown;
}

declare module "@adobe/aio-lib-core-logging" {
  export default function AioLogger(
    name: string,
    options?: { level?: string },
  ): {
    error: (...data: (object | string)[]) => void;
    info: (...data: (object | string)[]) => void;
    warn: (...data: (object | string)[]) => void;
  };
}

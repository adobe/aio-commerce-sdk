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

// @ts-expect-error `@adobe/aio-lib-core-config` ships no type declarations.
import aioConfig from "@adobe/aio-lib-core-config";
// `@adobe/aio-lib-ims` is CommonJS: a named import breaks in the ESM build at runtime, so use the
// default import and read `getToken` off it.
import aioLibIms from "@adobe/aio-lib-ims";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import consola from "consola";
import openwhisk from "openwhisk";

import type { AppData } from "#management/common/schema";

/** The Adobe IMS context the `aio` CLI stores its login under. */
const CLI_IMS_CONTEXT = "cli";

// Mirrors the installation action's own action name; not exported from the router, so re-declared.
const ACTION_NAME = "app-management/installation";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30_000;

/** The discriminated `code` returned by POST /update/self. */
export type SelfUpdateResponseCode =
  | "started"
  | "skipped-manual"
  | "skipped-not-installed"
  | "skipped-not-associated"
  | "noop"
  | "review-required"
  | "unsupported"
  | "busy";

/** The terminal outcome of the post-deploy auto self-update hook. */
export type PostDeployOutcome = {
  code: Exclude<SelfUpdateResponseCode, "busy"> | "gave-up";
};

/** Invokes POST /update/self on the installation action and returns its activation result. */
export type InvokeSelfUpdateAction = () => Promise<{
  response: { result: { body: { code: SelfUpdateResponseCode } } };
}>;

/** Minimal logging seam so tests don't assert against the real `consola` instance. */
export type PostDeployLogger = {
  debug: (message: string) => void;
  warn: (message: string) => void;
};

/** Injectable dependencies for {@link run}. */
export type PostDeployDeps = {
  /** Invokes the self-update action; called again on each `busy` retry. */
  invokeAction: InvokeSelfUpdateAction;

  /** Waits between retries; injected so tests don't sleep in real time. */
  sleep: (ms: number) => Promise<void>;

  /** Maximum number of invoke attempts before giving up. Defaults to 5. */
  maxAttempts?: number;

  /** The initial backoff delay (attempt 0), in milliseconds. Defaults to 1000. */
  baseDelayMs?: number;

  /** The maximum backoff delay, in milliseconds. Defaults to 30000. */
  maxDelayMs?: number;

  /** Logger for retry/give-up diagnostics. Defaults to `consola`. */
  logger?: PostDeployLogger;
};

/** Bounded exponential backoff, capped at `maxDelayMs`. */
export function backoffMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

/**
 * Drives the auto self-update after a deploy: invokes POST /update/self, retries with bounded
 * exponential backoff while the response is `busy`, and ends on any other code. Gives up after
 * `maxAttempts` still-busy responses.
 *
 * @param deps - The injectable seams driving the retry loop.
 */
export async function run(deps: PostDeployDeps): Promise<PostDeployOutcome> {
  const {
    invokeAction,
    sleep,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    logger = consola,
  } = deps;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: each retry depends on the previous invoke's response code, so attempts must be sequential.
    const { response } = await invokeAction();
    const { code } = response.result.body;

    if (code !== "busy") {
      return { code };
    }

    if (attempt === maxAttempts - 1) {
      break;
    }

    logger.debug(
      `Auto self-update busy (attempt ${attempt + 1}/${maxAttempts}); backing off.`,
    );
    await sleep(backoffMs(attempt, baseDelayMs, maxDelayMs));
  }

  logger.warn(
    `Auto self-update gave up: an operation was still in progress after ${maxAttempts} attempts.`,
  );
  return { code: "gave-up" };
}

/** The `project` block `aio` persists in `.aio` for the selected org/project/workspace. */
type AioProjectConfig = {
  id?: string;
  name?: string;
  title?: string;
  org?: { id?: string; name?: string; ims_org_id?: string };
  workspace?: { id?: string; name?: string; title?: string };
};

/** Reads the IMS org id the auth validator's `x-gw-ims-org-id` header requires. */
function getImsOrgId(env: Record<string, unknown>): string {
  const project = (aioConfig.get("project") ?? {}) as AioProjectConfig;
  return project.org?.ims_org_id ?? String(env.AIO_APP_IMS_ORG_ID ?? "");
}

/**
 * Builds the `appData` the self-update action requires. Sources it from the `aio` project config
 * (`.aio`, the authoritative record of the selected org/project/workspace), falling back to
 * `AIO_APP_*` environment variables.
 *
 * @param env - The deploy-time environment, used as a fallback.
 */
function buildAppData(env: Record<string, unknown>): AppData {
  const project = (aioConfig.get("project") ?? {}) as AioProjectConfig;
  const value = (fromConfig: string | undefined, envKey: string) =>
    fromConfig ?? String(env[envKey] ?? "");

  return {
    consumerOrgId: value(project.org?.id, "AIO_APP_CONSUMER_ORG_ID"),
    orgName: value(project.org?.name, "AIO_APP_ORG_NAME"),
    projectId: value(project.id, "AIO_APP_PROJECT_ID"),
    projectName: value(project.name, "AIO_APP_PROJECT_NAME"),
    projectTitle: value(project.title, "AIO_APP_PROJECT_TITLE"),
    workspaceId: value(project.workspace?.id, "AIO_APP_WORKSPACE_ID"),
    workspaceName: value(project.workspace?.name, "AIO_APP_WORKSPACE_NAME"),
    workspaceTitle: value(project.workspace?.title, "AIO_APP_WORKSPACE_TITLE"),
  };
}

/** Adobe I/O Runtime credentials needed to invoke the deployed installation action. */
export type RuntimeCredentials = {
  apihost: string;
  api_key?: string;
  namespace?: string;
};

/**
 * Reads Adobe I/O Runtime credentials from the environment `aio` loads for hooks (`AIO_runtime_*`
 * from the app `.env`), falling back to the in-action `__OW_*` variables. A post-deploy hook runs
 * on the developer/CI machine, not inside an action, so `openwhisk()` cannot auto-discover these.
 *
 * @param env - The process environment.
 */
export function getRuntimeCredentials(
  env: Record<string, unknown>,
): RuntimeCredentials {
  const pick = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = env[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
  };

  return {
    api_key: pick("AIO_runtime_auth", "AIO_RUNTIME_AUTH", "__OW_API_KEY"),
    apihost:
      pick("AIO_runtime_apihost", "AIO_RUNTIME_APIHOST", "__OW_API_HOST") ??
      "https://adobeioruntime.net",
    namespace: pick(
      "AIO_runtime_namespace",
      "AIO_RUNTIME_NAMESPACE",
      "__OW_NAMESPACE",
    ),
  };
}

/**
 * Runs the post-deploy hook, triggering the auto self-update after a deploy. Every failure is
 * swallowed so a broken self-update path can never fail the deploy itself.
 */
export async function exec(): Promise<void> {
  consola.debug("Running lib-app post-deploy hook");

  try {
    const env = process.env as Record<string, unknown>;
    const credentials = getRuntimeCredentials(env);

    if (!credentials.api_key) {
      consola.warn(
        "Post-deploy auto self-update skipped: no Adobe I/O Runtime credentials found in the environment.",
      );
      return;
    }

    // The installation action requires Adobe auth (`require-adobe-auth`), so present an IMS token
    // from the `aio` CLI login — the deployed action's auth validator rejects unauthenticated calls.
    const token = await aioLibIms
      .getToken(CLI_IMS_CONTEXT, {})
      .catch(() => undefined);
    if (!token) {
      consola.warn(
        "Post-deploy auto self-update skipped: could not obtain an Adobe IMS token from the `aio` CLI login.",
      );
      return;
    }

    const appData = buildAppData(env);
    const imsOrgId = getImsOrgId(env);
    const ow = openwhisk({
      api_key: credentials.api_key,
      apihost: credentials.apihost,
      namespace: credentials.namespace,
    });

    const invokeAction: InvokeSelfUpdateAction = async () => {
      // Shaped like an authenticated HTTP POST: the auth validator reads the Authorization and
      // `x-gw-ims-org-id` headers, then the router reads the method/path/body. The action
      // self-sources its own IMS/Commerce credentials, so only `appData` is sent in the body.
      const activation = await ow.actions.invoke({
        blocking: true,
        name: ACTION_NAME,
        params: {
          __ow_body: JSON.stringify({ appData }),
          __ow_headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "x-gw-ims-org-id": imsOrgId,
          },
          __ow_method: "post",
          __ow_path: "/update/self",
        },
      });

      return activation as unknown as Awaited<
        ReturnType<InvokeSelfUpdateAction>
      >;
    };

    const outcome = await run({
      invokeAction,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });

    consola.debug(`Auto self-update finished with code: ${outcome.code}`);
  } catch (error) {
    consola.warn(
      `Post-deploy auto self-update hook failed: ${stringifyError(error)}`,
    );
  }
}

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

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import consola from "consola";
import openwhisk from "openwhisk";

import { getAssociationData } from "#management/association/repository";
import { createEmStatusClient } from "#management/upgrade/em-status-client";

import type { AppData } from "#management/installation/schema";
import type { WriteUpdateStatusInput } from "#management/upgrade/em-status-client";

// Mirrors the installation action's own action name (spec §11); not exported
// from the router, so it's re-declared here for the invoke call.
const ACTION_NAME = "app-management/installation";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30_000;

/** The discriminated `code` returned by `POST /update/self`. */
export type SelfUpdateResponseCode =
  | "started"
  | "skipped-manual"
  | "skipped-not-installed"
  | "review-required"
  | "unsupported"
  | "busy";

/** The terminal outcome of the post-deploy auto self-update hook. */
export type PostDeployOutcome = {
  code: Exclude<SelfUpdateResponseCode, "busy"> | "gave-up";
};

/** Invokes `POST /update/self` on the installation action and returns its activation result. */
export type InvokeSelfUpdateAction = () => Promise<{
  response: { result: { body: { code: SelfUpdateResponseCode } } };
}>;

/** The subset of {@link EmStatusClient} the hook needs to report a give-up. */
export type PostDeployEmClient = {
  writeUpdateStatus: (input: WriteUpdateStatusInput) => Promise<void>;
};

/** Minimal logging seam so tests don't have to assert against the real `consola` instance. */
export type PostDeployLogger = {
  debug: (message: string) => void;
  warn: (message: string) => void;
};

/** Injectable dependencies for {@link run}. */
export type PostDeployDeps = {
  /** Invokes the auto self-update action; called again on each `busy` retry. */
  invokeAction: InvokeSelfUpdateAction;

  /** Reports the give-up terminal status to the Extension Manager. */
  emClient: PostDeployEmClient;

  /** Resolves the extension's Extension Manager id, if this install has one on record. */
  getExtensionId: () => Promise<string | undefined>;

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

/** Bounded exponential backoff, capped at `maxDelayMs` (spec §11). */
export function backoffMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

/**
 * Drives the auto self-update after a deploy: invokes `POST /update/self`,
 * retries with bounded exponential backoff while the response is `busy`, and
 * ends on any other code.
 *
 * On give-up (still `busy` after `maxAttempts`), best-effort writes an
 * `UPDATE_FAILED` status to the Extension Manager so the app surfaces as
 * needing attention — skipped when no `extensionId` is on record, mirroring
 * `reportUpdateStatus`'s best-effort skip. Every other terminal code ends the
 * loop immediately without a give-up write, since the action already wrote
 * any Extension Manager status it needed to.
 *
 * @param deps - The injectable seams driving the retry loop.
 */
export async function run(deps: PostDeployDeps): Promise<PostDeployOutcome> {
  const {
    invokeAction,
    emClient,
    getExtensionId,
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

    const isLastAttempt = attempt === maxAttempts - 1;
    if (isLastAttempt) {
      break;
    }

    logger.debug(
      `Auto self-update busy (attempt ${attempt + 1}/${maxAttempts}); backing off.`,
    );

    await sleep(backoffMs(attempt, baseDelayMs, maxDelayMs));
  }

  const giveUpReason = `Auto update gave up: an operation was still in progress after ${maxAttempts} attempts.`;
  logger.warn(giveUpReason);

  const extensionId = await getExtensionId();
  if (extensionId) {
    await emClient.writeUpdateStatus({
      error: { message: giveUpReason },
      extensionId,
      status: "UPDATE_FAILED",
      timestamp: new Date().toISOString(),
    });
  }

  return { code: "gave-up" };
}

/**
 * Builds the `appData` param the auto self-update action requires (spec §8.5).
 *
 * @param env - The deploy-time environment to read app-identity fields from.
 */
// WHY: the `AIO_APP_*` variable names below are an unverified assumption —
// there is no confirmed source for `appData` in a post-deploy hook's runtime
// environment yet (spec §8.5). Confirm against the real deploy runtime
// before relying on this in production.
function buildAppData(env: Record<string, unknown>): AppData {
  return {
    consumerOrgId: String(env.AIO_APP_CONSUMER_ORG_ID ?? ""),
    orgName: String(env.AIO_APP_ORG_NAME ?? ""),
    projectId: String(env.AIO_APP_PROJECT_ID ?? ""),
    projectName: String(env.AIO_APP_PROJECT_NAME ?? ""),
    projectTitle: String(env.AIO_APP_PROJECT_TITLE ?? ""),
    workspaceId: String(env.AIO_APP_WORKSPACE_ID ?? ""),
    workspaceName: String(env.AIO_APP_WORKSPACE_NAME ?? ""),
    workspaceTitle: String(env.AIO_APP_WORKSPACE_TITLE ?? ""),
  };
}

/** Runs the post-deploy hook, driving the auto self-update after a deploy. */
export async function exec(): Promise<void> {
  consola.debug("Running lib-app post-deploy hook");

  // WHY: whether this hook can actually reach the deployed installation
  // action, and whether `appData` + Commerce/IMS credentials can be
  // self-sourced from the deploy-time environment, are both unvalidated
  // (spec §8.5) — there is no integration test exercising this against a
  // real deploy yet. Every failure mode here is swallowed below so a broken
  // self-update path can never fail the deploy itself.
  try {
    const env = process.env as Record<string, unknown>;
    const appData = buildAppData(env);

    const invokeAction: InvokeSelfUpdateAction = async () => {
      const activation = await openwhisk().actions.invoke({
        blocking: true,
        name: ACTION_NAME,
        params: {
          ...env,
          __ow_method: "post",
          __ow_path: "/update/self",
          appData,
        },
      });

      return activation as unknown as Awaited<
        ReturnType<InvokeSelfUpdateAction>
      >;
    };

    const outcome = await run({
      emClient: createEmStatusClient({ auth: env }),
      getExtensionId: async () => (await getAssociationData())?.extensionId,
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

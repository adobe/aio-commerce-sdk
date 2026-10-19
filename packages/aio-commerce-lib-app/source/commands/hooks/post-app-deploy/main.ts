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
  getTempLogPath,
  spawnDetached,
} from "@aio-commerce-sdk/scripting-utils/process";
import {
  detectPackageManager,
  getExecCommand,
} from "@aio-commerce-sdk/scripting-utils/project";
import { consola } from "consola";
import { colors } from "consola/utils";

import {
  createCamsContext,
  findWorkspaceExtensionId,
} from "#commands/common/cams/context";
import { CamsConflictError } from "#commands/common/cams/errors";
import { reportFailure } from "#commands/common/cams/report";
import { noticeInterrupt } from "#commands/hooks/post-app-deploy/interrupt";
import {
  describeOutcome,
  pollUntilSettled,
  whenStatusChanges,
} from "#commands/upgrade/poll";
import { parseCommerceAppConfig } from "#config/lib/parser";

import type { CamsContext } from "#commands/common/cams/context";
import type { AttemptStatus, UpgradePlan } from "#commands/common/cams/schema";
import type { InterruptNotice } from "#commands/hooks/post-app-deploy/interrupt";

/** The codes that end the hook without an upgrade and without an error. */
type SkipCode = "already-current" | "not-associated" | "not-installed";

/** How the hook ended when it did not fail. */
type HookResult =
  | { kind: "skipped"; code: SkipCode }
  | { kind: "planned"; plan: UpgradePlan }
  | { kind: "upgraded"; runId: string };

function isSkipCode(code: unknown): code is SkipCode {
  return (
    code === "already-current" ||
    code === "not-associated" ||
    code === "not-installed" ||
    code === "in-progress"
  );
}

/**
 * Asks the service to plan the upgrade.
 * @returns The plan, or the code of the reason the upgrade does not apply.
 */
async function planUpgrade(context: CamsContext, extensionId: string) {
  try {
    return await context.client.planUpgrade({ extensionId });
  } catch (error) {
    if (error instanceof CamsConflictError) {
      if (isSkipCode(error.code)) {
        return error.code;
      }

      throw new Error(`The upgrade was not planned: ${error.message}`, {
        cause: error,
      });
    }

    throw error;
  }
}

/** Starts the planned upgrade and returns the status of the new run. */
async function startUpgrade(
  context: CamsContext,
  extensionId: string,
  plan: UpgradePlan,
) {
  try {
    return await context.client.startUpgrade({ extensionId, planId: plan.id });
  } catch (error) {
    if (error instanceof CamsConflictError) {
      throw new Error(`The upgrade was not started: ${error.message}`, {
        cause: error,
      });
    }

    throw error;
  }
}

/**
 * Starts the watcher that follows the run if this process stops. The run goes on without the
 * watcher.
 *
 * @returns Whether the watcher started.
 */
function startBackgroundWatcher(extensionId: string, started: AttemptStatus) {
  const logPath = getTempLogPath(`aio-commerce-upgrade-${started.id}`);
  const args = ["upgrade", "watch", extensionId, started.id];

  consola.debug("Starting the watcher.", { args, logPath });
  const watcher = spawnDetached({
    args,
    logPath,
    onError: (error) => {
      consola.debug("The watcher could not start.", { args, error, logPath });
    },
    script: process.argv[1],
  });

  if (!watcher) {
    return false;
  }

  consola.debug(`Watcher log: ${logPath}`);
  return true;
}

/** Polls the run and prints its progress until it settles. Throws when it does not succeed. */
async function followRun(
  context: CamsContext,
  extensionId: string,
  started: AttemptStatus,
) {
  const result = await pollUntilSettled({
    onRetry: (error) => {
      consola.warn(`${error.message}. Trying again.`);
    },
    onStatus: whenStatusChanges((status) => {
      consola.start(`App upgrade is ${colors.yellow(status.status)}.`);
    }),
    poll: () => context.client.pollUpgrade({ extensionId, runId: started.id }),
  });

  const outcome = describeOutcome(result, started.id);
  if (!outcome.succeeded) {
    throw new Error(outcome.message, {
      cause: result.kind === "finished" ? undefined : result.error,
    });
  }

  consola.success(`${outcome.message}\n`);
}

/**
 * The command that runs `upgrade status` with the package manager of the project. It is `npx`
 * when the package manager cannot be detected.
 */
async function getStatusCommand() {
  const packageManager = await detectPackageManager(process.cwd()).catch(
    () => "npm" as const,
  );

  return `${getExecCommand(packageManager)} aio-commerce-lib-app upgrade status`;
}

/** Plans, starts and follows the upgrade. Tells `interrupt` the run id once the run exists. */
async function runHook(interrupt: InterruptNotice): Promise<HookResult> {
  const appConfig = await parseCommerceAppConfig();
  const { upgradeMode } = appConfig.metadata;

  console.log(""); // Leave a bit of whitespace before the output to make it more readable.
  consola.start("Checking for app upgrades...");

  const context = createCamsContext();
  consola.debug(`Service: ${context.baseUrl}`);

  const extensionId = await findWorkspaceExtensionId(context);
  if (!extensionId) {
    consola.info("No upgrade was run: not-associated.\n");
    return { code: "not-associated", kind: "skipped" };
  }

  const plan = await planUpgrade(context, extensionId);
  if (typeof plan === "string") {
    consola.info(`No upgrade was run: ${plan}.\n`);
    return { code: plan, kind: "skipped" };
  }

  if (upgradeMode === "manual") {
    consola.success(
      `Upgrade detected. A plan has been created but will not be executed since ${colors.cyan("metadata.upgradeMode")} is set to ${colors.cyan("manual")}.\n`,
    );
  } else {
    consola.success(
      `Upgrade detected. A plan has been created and execution will begin shortly since ${colors.cyan("metadata.upgradeMode")} is set to ${colors.cyan("auto")}.\n`,
    );
  }

  consola.debug({
    message: JSON.stringify(plan, null, 2),
    title: "Upgrade Plan\n\n",
    type: "box",
  });

  if (upgradeMode === "manual") {
    return { kind: "planned", plan };
  }

  const started = await startUpgrade(context, extensionId, plan);
  interrupt.setRunId(started.id);

  consola.info(`App upgrade started (run ${colors.cyan(started.id)}).`);
  if (startBackgroundWatcher(extensionId, started)) {
    interrupt.setWatcherStarted();
  }

  await followRun(context, extensionId, started);
  return { kind: "upgraded", runId: started.id };
}

/**
 * Runs the hook: plans an upgrade of the app and, with `metadata.upgradeMode` set to `auto`, starts
 * it and follows it until it settles.
 *
 * The hook runs after the deploy, so it cannot undo it. Its exit code only reports what the
 * upgrade did.
 *
 * @throws When the upgrade is refused, fails or does not finish in time.
 */
export async function run(): Promise<HookResult> {
  const statusCommand = await getStatusCommand();
  const interrupt = noticeInterrupt(statusCommand);

  try {
    return await runHook(interrupt);
  } finally {
    interrupt.dispose();
  }
}

export async function exec() {
  try {
    await run();
  } catch (error) {
    reportFailure(error);
    process.exit(1);
  }
}

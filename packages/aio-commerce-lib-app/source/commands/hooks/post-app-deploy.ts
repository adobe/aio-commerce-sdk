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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  getAioCliEnv,
  getAioProjectContext,
  getUserToken,
} from "@aio-commerce-sdk/scripting-utils/aio";
import { consola } from "consola";
import { colors } from "consola/utils";
import ky, { HTTPError } from "ky";

import { parseCommerceAppConfig } from "#config/lib/parser";

import type { DomainPlan } from "#management/common/workflow/resource";

type SkippedResult = { skipped: true; reason: string };
type UpgradePlanResult = { plan: DomainPlan };
type UpgradeResult = SkippedResult | UpgradePlanResult;

/** Returns true if the result indicates that the upgrade was skipped. */
function isSkippedResult(result: UpgradeResult): result is SkippedResult {
  return "skipped" in result;
}

/** Invokes the upgrade action. */
async function invokeAction(): Promise<UpgradeResult> {
  const { project, namespace } = getAioProjectContext();
  const token = await getUserToken();

  const endpoint = `https://${namespace}.adobeioruntime.net/api/v1/web/app-management/installation`;
  consola.debug(`Upgrade endpoint: ${endpoint}`);

  const ioEventsEnv = getAioCliEnv();
  const ioEventsUrl =
    ioEventsEnv === "stage"
      ? "https://events-stage.adobe.io"
      : "https://events.adobe.io";

  try {
    return await ky
      .post(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-gw-ims-org-id": project.org.ims_org_id,
        },
        json: {
          appData: {
            consumerOrgId: project.org.id,
            orgName: project.org.name,
            projectId: project.id,
            projectName: project.name,
            projectTitle: project.title,
            workspaceId: project.workspace.id,
            workspaceName: project.workspace.name,
            workspaceTitle: project.workspace.title,
          },

          ioEventsEnv,
          ioEventsUrl,
        },
      })
      .json<UpgradePlanResult>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const details = await error.response.json<{ reason?: string }>();

      // A 409 carrying a `reason` is an expected no-op state (e.g. not-associated,
      // already-current) — nothing to upgrade, not a failure.
      if (error.response.status === 409 && details.reason) {
        return { reason: details.reason, skipped: true };
      }

      throw new Error(
        `Failed to trigger app upgrade (HTTP ${error.response.status}): ${JSON.stringify(details, null, 2)}`,
        { cause: error },
      );
    }

    throw error;
  }
}

/** Invokes the deployed app's upgrade endpoint. */
export async function run() {
  const appConfig = await parseCommerceAppConfig();
  const { upgradeMode } = appConfig.metadata;

  consola.start("Checking for app upgrades...");
  const result = await invokeAction();

  if (isSkippedResult(result)) {
    consola.info(`No upgrade was run: ${result.reason}.`);
    return result;
  }

  if (upgradeMode === "manual") {
    consola.success(
      `You have set ${colors.cyan("metadata.upgradeMode")} to ${colors.cyan("manual")}. The upgrade plan has been created. Apply it from the App Management UI`,
    );
  } else {
    consola.success(
      `You have set ${colors.cyan("metadata.upgradeMode")} to ${colors.cyan("auto")}. The upgrade plan has been created. Execution will begin shortly.`,
    );
  }

  consola.box(
    ["Upgrade plan", JSON.stringify(result.plan, null, 2)].join("\n\n"),
  );

  return result;
}

/** Runs the post-app-deploy hook. */
export async function exec() {
  try {
    await run();
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }

    process.exit(1);
  }
}

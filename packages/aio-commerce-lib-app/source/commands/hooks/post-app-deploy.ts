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
// @ts-expect-error - The library doesn't export types.
import config from "@adobe/aio-lib-core-config";
import aioIms from "@adobe/aio-lib-ims";
import { consola } from "consola";
import { colors } from "consola/utils";

import { parseCommerceAppConfig } from "#config/lib/parser";

import type { DomainPlan } from "#management/common/workflow/resource";

type ProjectConfig = {
  id: string;
  name: string;
  org: {
    id: string;
    ims_org_id: string;
    name: string;
  };
  title: string;
  workspace: {
    id: string;
    name: string;
    title: string;
  };
};

type Environment = "stage" | "prod" | undefined;

type SkippedResult = { skipped: true; reason: string };
type UpgradePlanResult = { plan: DomainPlan };
type UpgradeResult = SkippedResult | UpgradePlanResult;

/** Returns true if the result indicates that the upgrade was skipped. */
function isSkippedResult(result: UpgradeResult): result is SkippedResult {
  return "skipped" in result;
}

/** Invokes the deployed app's upgrade endpoint. */
export async function run() {
  const appConfig = await parseCommerceAppConfig();
  const { upgradeMode } = appConfig.metadata;

  const project = config.get("project") as ProjectConfig | undefined;
  const namespace = config.get("runtime.namespace") as string | undefined;

  if (!(project && namespace)) {
    throw new Error(
      "The current App Builder project and Runtime namespace are required",
    );
  }

  const contextName = (await aioIms.context.getCurrent()) ?? "cli";
  const token = await aioIms.getToken(contextName, {});
  const endpoint = `https://${namespace}.adobeioruntime.net/api/v1/web/app-management/installation/upgrade`;

  consola.start("Checking for app upgrades...");
  consola.debug(`Upgrade endpoint: ${endpoint}`);

  const ioEventsEnv = (config.get("cli.env") as Environment) ?? "prod";
  const ioEventsUrl =
    ioEventsEnv === "stage"
      ? "https://events-stage.adobe.io"
      : "https://events.adobe.io";

  const response = await fetch(endpoint, {
    body: JSON.stringify({
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
    }),

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-gw-ims-org-id": project.org.ims_org_id,
    },

    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger app upgrade: ${response.status}`);
  }

  const result = (await response.json()) as UpgradeResult;

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
      `You have set ${colors.cyan("metadata.upgradeMode")} to ${colors.cyan("automatic")}. The upgrade plan has been created. Execution will begin shortly (automatic mode).`,
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

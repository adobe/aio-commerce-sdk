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

import { parseCommerceAppConfig } from "#config/lib/parser";

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

/** Invokes the deployed app's upgrade endpoint. */
export async function run() {
  const appConfig = await parseCommerceAppConfig();
  const upgradeMode = appConfig.metadata.upgradeMode ?? "auto";
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

  console.log(`\nTriggering the app upgrade endpoint: ${endpoint}`);

  const ioEventsEnv = process.env.AIO_CLI_ENV ?? "prod";
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
      "X-OW-EXTRA-LOGGING": "on",
      "x-gw-ims-org-id": project.org.ims_org_id,
    },
    method: "POST",
  });

  const result = await response.json();
  console.log(
    `App upgrade endpoint returned ${response.status}:\n${JSON.stringify(result, null, 2)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to trigger app upgrade: ${response.status}`);
  }

  if (upgradeMode === "manual") {
    console.log("Upgrade plan created.");
  } else {
    console.log(
      "Upgrade is automatic. The plan was created and execution will begin shortly.",
    );
  }

  console.log();
  return result;
}

/** Runs the post-app-deploy hook. */
export async function exec() {
  await run();
}

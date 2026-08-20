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

import { setTimeout as delay } from "node:timers/promises";

import { consola } from "consola";
import ky from "ky";
import * as v from "valibot";

const POLL_INTERVAL_MS = 1000;
const UpgradeStateSchema = v.object({
  failure: v.optional(
    v.object({
      key: v.string(),
      message: v.optional(v.string()),
    }),
  ),
  id: v.string(),
  status: v.picklist(["pending", "in-progress", "succeeded", "failed"]),
});

type UpgradeStatusRequest = {
  endpoint: string;
  headers: Record<string, string>;
};

type UpgradeState = v.InferOutput<typeof UpgradeStateSchema>;

/** Reads the latest upgrade state from the installation action. */
async function getUpgradeState(
  request: UpgradeStatusRequest,
): Promise<UpgradeState | null> {
  try {
    const response = await ky.get(request.endpoint, {
      headers: request.headers,
    });

    if (response.status === 204) {
      return null;
    }

    const parsed = v.safeParse(UpgradeStateSchema, await response.json());
    return parsed.success ? parsed.output : null;
  } catch (error) {
    consola.debug("Unable to read upgrade status; stopping upgrade polling.", {
      error,
    });

    return null;
  }
}

/** Waits for an automatic upgrade when its status remains available. */
export async function waitForAutomaticUpgrade(
  request: UpgradeStatusRequest,
): Promise<void> {
  const state = await getUpgradeState(request);
  if (!state) {
    return;
  }

  if (state.status === "succeeded") {
    consola.success("App upgrade completed.");
    return;
  }

  if (state.status === "failed") {
    const reason =
      state.failure?.message ??
      state.failure?.key ??
      "The lifecycle attempt failed";

    throw new Error(`App upgrade failed: ${reason}`);
  }

  consola.start("App upgrade is in progress...");
  await delay(POLL_INTERVAL_MS);

  return waitForAutomaticUpgrade(request);
}

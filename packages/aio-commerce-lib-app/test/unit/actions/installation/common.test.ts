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

import { describe, expect, test } from "vitest";

import {
  buildLifecycleContext,
  getExecutedCustomInstallationSteps,
} from "#actions/installation/common";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
  DEFAULT_INSTALLATION_IMS_PARAMS,
} from "#test/fixtures/installation";
import {
  createMockAppStateSnapshot,
  createMockLifecycleAttempt,
  createMockOrchestrationState,
} from "#test/fixtures/lifecycle";

import type { WorkflowRouteParams } from "#actions/installation/common";

const { appData, logger } = createMockInstallationContext();

function buildParams(params: Record<string, unknown>) {
  return { ...params, appData } as WorkflowRouteParams;
}

describe("buildLifecycleContext", () => {
  test("backfills deprecated IMS params from include-ims-credentials credentials", () => {
    const context = buildLifecycleContext(
      buildParams({
        __ims_oauth_s2s: {
          clientId: "annotated-client-id",
          clientSecret: "annotated-secret",
          orgId: "annotated-org-id",
          scopes: ["openid"],
        },
      }),
      minimalValidConfig,
      logger,
    );

    expect(context.params).toMatchObject({
      AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "annotated-client-id",
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["annotated-secret"],
      AIO_COMMERCE_AUTH_IMS_ORG_ID: "annotated-org-id",
      AIO_COMMERCE_AUTH_IMS_SCOPES: ["openid"],
    });
  });

  test("keeps explicitly provided IMS params", () => {
    const context = buildLifecycleContext(
      buildParams(DEFAULT_INSTALLATION_IMS_PARAMS),
      minimalValidConfig,
      logger,
    );

    expect(context.params).toMatchObject(DEFAULT_INSTALLATION_IMS_PARAMS);
  });

  test("does not add IMS params when no credentials can be resolved", () => {
    const context = buildLifecycleContext(
      buildParams({}),
      minimalValidConfig,
      logger,
    );

    expect(context.params).not.toHaveProperty(
      "AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
    );
  });
});

describe("getExecutedCustomInstallationSteps", () => {
  const FIRST = { name: "First", script: "./first.js" };
  const SECOND = { name: "Second", script: "./second.js" };

  const baseline = createMockAppStateSnapshot({
    data: { installation: { customInstallationSteps: { first: FIRST } } },
  });

  const attemptData = {
    installation: { customInstallationSteps: { first: FIRST, second: SECOND } },
  };

  test("returns null when neither an attempt nor a baseline is stored", () => {
    expect(getExecutedCustomInstallationSteps(null, null)).toBeNull();
  });

  test("reads the baseline when no attempt is stored", () => {
    const state = createMockOrchestrationState();

    expect(getExecutedCustomInstallationSteps(state, baseline)).toEqual([
      FIRST,
    ]);
  });

  test("reads the baseline when the latest attempt succeeded", () => {
    const state = createMockOrchestrationState({
      latestAttempt: createMockLifecycleAttempt({
        data: attemptData,
        status: "succeeded",
      }),
    });

    expect(getExecutedCustomInstallationSteps(state, baseline)).toEqual([
      FIRST,
    ]);
  });

  test.each(["failed", "pending", "in-progress"] as const)(
    "reads the latest attempt when it is %s",
    (status) => {
      const state = createMockOrchestrationState({
        latestAttempt: createMockLifecycleAttempt({
          data: attemptData,
          status,
        }),
      });

      expect(getExecutedCustomInstallationSteps(state, baseline)).toEqual([
        FIRST,
        SECOND,
      ]);
    },
  );

  test("returns no steps after an uninstall succeeded", () => {
    const state = createMockOrchestrationState({
      baselineSnapshotId: null,
      latestAttempt: createMockLifecycleAttempt({
        data: null,
        operation: "uninstall",
        status: "succeeded",
      }),
    });

    expect(getExecutedCustomInstallationSteps(state, null)).toEqual([]);
  });
});

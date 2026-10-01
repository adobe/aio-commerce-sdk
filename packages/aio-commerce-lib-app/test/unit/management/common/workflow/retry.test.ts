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

import { createRetryState } from "#management/common/workflow/retry";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockFailedState,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";
import { createMockStepStatus } from "#test/fixtures/workflow";

describe("createRetryState", () => {
  test("should preserve id and startedAt from failed state", () => {
    const failedState = createMockFailedState({
      id: "install-abc",
      startedAt: FAKE_SYSTEM_TIME,
    });

    const retryState = createRetryState(failedState);

    expect(retryState.id).toBe("install-abc");
    expect(retryState.startedAt).toBe(FAKE_SYSTEM_TIME);
    expect(retryState.status).toBe("in-progress");
  });

  test("should preserve succeeded child statuses and reset failed child to pending", () => {
    const failedState = createMockFailedState({
      step: createMockStepStatus({
        children: [
          createMockStepStatus({
            name: "step-a",
            path: ["installation", "step-a"],
            status: "succeeded",
          }),
          createMockStepStatus({
            name: "step-b",
            path: ["installation", "step-b"],
            status: "failed",
          }),
        ],
        status: "failed",
      }),
    });

    const retryState = createRetryState(failedState);

    expect(retryState.step.children[0].status).toBe("succeeded");
    expect(retryState.step.children[1].status).toBe("pending");
  });

  test("should reset root step to pending when it was failed", () => {
    const failedState = createMockFailedState({
      step: createMockStepStatus({ children: [], status: "failed" }),
    });

    const retryState = createRetryState(failedState);

    expect(retryState.step.status).toBe("pending");
  });

  test("should carry over data from the failed state", () => {
    const partialData = { installation: { "step-a": { id: "123" } } };
    const failedState = createMockFailedState({ data: partialData });

    const retryState = createRetryState(failedState);

    expect(retryState.data).toBe(partialData);
  });

  test("should carry over the config from the failed state", () => {
    const failedState = createMockFailedState({ config: minimalValidConfig });

    const retryState = createRetryState(failedState);

    expect(retryState.config).toEqual(minimalValidConfig);
  });
});

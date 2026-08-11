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

import { describe, expect, test, vi } from "vitest";

import {
  backoffMs,
  getRuntimeCredentials,
  run,
} from "#commands/hooks/post-deploy";

import type {
  PostDeployLogger,
  SelfUpdateResponseCode,
} from "#commands/hooks/post-deploy";

function invokeReturning(...codes: SelfUpdateResponseCode[]) {
  const queue = [...codes];
  return vi.fn(async () => ({
    response: { result: { body: { code: queue.shift() ?? "busy" } } },
  }));
}

const silentLogger: PostDeployLogger = { debug: vi.fn(), warn: vi.fn() };

describe("getRuntimeCredentials", () => {
  test("reads the aio `AIO_runtime_*` env the deploy hook is given", () => {
    expect(
      getRuntimeCredentials({
        AIO_runtime_apihost: "https://adobeioruntime.net",
        AIO_runtime_auth: "uuid:key",
        AIO_runtime_namespace: "my-namespace",
      }),
    ).toEqual({
      api_key: "uuid:key",
      apihost: "https://adobeioruntime.net",
      namespace: "my-namespace",
    });
  });

  test("falls back to __OW_* and a default apihost", () => {
    expect(
      getRuntimeCredentials({ __OW_API_KEY: "uuid:key", __OW_NAMESPACE: "ns" }),
    ).toEqual({
      api_key: "uuid:key",
      apihost: "https://adobeioruntime.net",
      namespace: "ns",
    });
  });

  test("returns no api_key when the environment has no Runtime credentials", () => {
    expect(getRuntimeCredentials({}).api_key).toBeUndefined();
  });
});

describe("backoffMs", () => {
  test("doubles per attempt and caps at maxDelayMs", () => {
    expect(backoffMs(0, 1000, 30_000)).toBe(1000);
    expect(backoffMs(3, 1000, 30_000)).toBe(8000);
    expect(backoffMs(10, 1000, 30_000)).toBe(30_000);
  });
});

describe("post-deploy run", () => {
  test("returns immediately on a non-busy code without sleeping", async () => {
    const invokeAction = invokeReturning("started");
    const sleep = vi.fn().mockResolvedValue(undefined);

    const outcome = await run({ invokeAction, logger: silentLogger, sleep });

    expect(outcome).toEqual({ code: "started" });
    expect(invokeAction).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  test("retries while busy, then ends on the first non-busy code", async () => {
    const invokeAction = invokeReturning("busy", "busy", "noop");
    const sleep = vi.fn().mockResolvedValue(undefined);

    const outcome = await run({ invokeAction, logger: silentLogger, sleep });

    expect(outcome).toEqual({ code: "noop" });
    expect(invokeAction).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  test("gives up after maxAttempts of busy", async () => {
    const invokeAction = invokeReturning("busy", "busy", "busy");
    const sleep = vi.fn().mockResolvedValue(undefined);

    const outcome = await run({
      invokeAction,
      logger: silentLogger,
      maxAttempts: 3,
      sleep,
    });

    expect(outcome).toEqual({ code: "gave-up" });
    expect(invokeAction).toHaveBeenCalledTimes(3);
    // No sleep after the final (giving-up) attempt.
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});

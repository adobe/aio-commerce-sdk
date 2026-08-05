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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createInitialState,
  executeUpdateWorkflow,
} from "#management/installation/workflow/runner";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

import type { LeafStep } from "#management/installation/workflow/step";
import type { ConfigDiff } from "#management/upgrade/types";

/**
 * Wraps a single leaf step in a one-child branch and runs it through
 * `executeUpdateWorkflow`, mirroring how the existing runner tests drive a
 * single step through `executeWorkflow`/`executeUninstallWorkflow`.
 */
async function runLeafInUpdateMode(step: LeafStep, diff: ConfigDiff) {
  const rootStep = defineBranchStep({
    children: [step],
    meta: { install: { label: "Root" } },
    name: "root",
  });

  const installationContext = createMockInstallationContext();
  const initialState = createInitialState({
    config: minimalValidConfig,
    mode: "update",
    rootStep,
  });

  return executeUpdateWorkflow({
    config: minimalValidConfig,
    diff,
    initialState,
    installationContext,
    rootStep,
  });
}

describe("update execution mode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calls reconcile() when present, not install()", async () => {
    const install = vi.fn();
    const reconcile = vi.fn().mockResolvedValue({ ok: true });
    const step = defineLeafStep({
      install,
      meta: { install: { label: "X" } },
      name: "x",
      reconcile,
    });

    await runLeafInUpdateMode(step, { changes: [] });

    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(install).not.toHaveBeenCalled();
  });

  test("falls back to install() when reconcile() is absent", async () => {
    const install = vi.fn().mockResolvedValue({ ok: true });
    const step = defineLeafStep({
      install,
      meta: { install: { label: "X" } },
      name: "x",
    });

    await runLeafInUpdateMode(step, { changes: [] });

    expect(install).toHaveBeenCalledTimes(1);
  });
});

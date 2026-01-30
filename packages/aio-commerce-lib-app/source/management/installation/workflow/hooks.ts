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

import type { InstallationError, InstallationState } from "./types";

/** Hook function that receives an event and the current state. */
type HookFunction<TEvent> = (
  event: TEvent,
  state: InstallationState,
) => void | Promise<void>;

/** Hook function that only receives the current state. */
type InstallationHook = (state: InstallationState) => void | Promise<void>;

/** Base event payload for step events. */
export type StepEvent = {
  /** Full path to the step (e.g., ["eventing", "commerce", "providers"]). */
  path: string[];

  /** Step name (last element of path, for convenience). */
  stepName: string;

  /** Whether this is a leaf step (executable) or branch step (container). */
  isLeaf: boolean;
};

/** Event payload when a step starts execution. */
export type StepStartedEvent = StepEvent;

/** Event payload when a step succeeds. */
export type StepSucceededEvent = StepEvent & {
  /** Result returned by the step (only for leaf steps). */
  result: unknown;
};

/** Event payload when a step fails. */
export type StepFailedEvent = StepEvent & {
  /** Error information. */
  error: InstallationError;
};

/** Lifecycle hooks for installation execution. */
export type InstallationHooks = {
  onInstallationStart?: InstallationHook;
  onInstallationSuccess?: InstallationHook;
  onInstallationFailure?: InstallationHook;

  onStepStart?: HookFunction<StepStartedEvent>;
  onStepSuccess?: HookFunction<StepSucceededEvent>;
  onStepFailure?: HookFunction<StepFailedEvent>;
};

/** Helper to call a hook if it exists. */
export async function callHook<THookName extends keyof InstallationHooks>(
  hooks: InstallationHooks | undefined,
  hookName: THookName,
  ...args: Parameters<NonNullable<InstallationHooks[THookName]>>
): Promise<void> {
  const hook = hooks?.[hookName];
  if (hook) {
    // @ts-expect-error - TypeScript struggles with the union of hook signatures
    await hook(...args);
  }
}

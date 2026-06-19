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

import type { Plan, PlanAction } from "./plan";
import type { Provider } from "./provider";

export interface Lock {
  acquire(): Promise<void>;
  forceRelease(): Promise<void>;
  release(): Promise<void>;
}

export type ResourceOutcome<TState = unknown> =
  | { status: "created"; state: TState }
  | { status: "updated"; state: TState }
  | { status: "replaced"; state: TState }
  | { status: "deleted" }
  | { status: "noop" }
  | { status: "failed"; error: unknown }
  | { status: "blocked"; blockedBy: string };

export type ResourceRecord<TDesired = unknown, TState = unknown> = {
  readonly key: string;
  readonly desired: TDesired;
  readonly outcome: ResourceOutcome<TState>;
};

export type ProviderSnapshot = {
  readonly kind: string;
  readonly resources: readonly ResourceRecord[];
};

export type AppliedSnapshot = {
  readonly id: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly forced: boolean;
  readonly providers: readonly ProviderSnapshot[];
};

export type ReconcileEvent =
  | { type: "plan-ready"; plan: Plan }
  | {
      type: "action-started";
      resource: string;
      key: string;
      kind: PlanAction["kind"];
    }
  | {
      type: "action-completed";
      resource: string;
      key: string;
      outcome: ResourceOutcome;
    }
  | { type: "resource-blocked"; resource: string; blockedBy: string }
  | { type: "reconcile-complete"; result: ReconcileResult };

export interface PlanOptions {
  previousSnapshot?: AppliedSnapshot;
}

export interface ApplyOptions {
  force?: boolean;
  lock?: Lock;
  maxConcurrency?: number;
  onEvent?: (event: ReconcileEvent) => Promise<void>;
}

export type ReconcileOptions = PlanOptions & ApplyOptions;

export interface ReconcileResult {
  readonly plan: Plan;
  readonly snapshot: AppliedSnapshot;
}

export type PlanFn = <TConfig>(
  providers: readonly Provider<TConfig>[],
  config: TConfig,
  options?: PlanOptions,
) => Promise<Plan>;

export type ApplyFn = (
  providers: readonly Provider<unknown>[],
  plan: Plan,
  options?: ApplyOptions,
) => Promise<ReconcileResult>;

export type ReconcileFn = <TConfig>(
  providers: readonly Provider<TConfig>[],
  config: TConfig,
  options?: ReconcileOptions,
) => Promise<ReconcileResult>;

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

export type PlanAction<TDesired = unknown, TState = unknown> =
  | {
      kind: "noop";
      resource: string;
      key: string;
      dependsOn: readonly string[];
    }
  | {
      kind: "create";
      resource: string;
      key: string;
      dependsOn: readonly string[];
      desired: TDesired;
    }
  | {
      kind: "update";
      resource: string;
      key: string;
      dependsOn: readonly string[];
      current: TState;
      desired: TDesired;
    }
  | {
      kind: "replace";
      resource: string;
      key: string;
      dependsOn: readonly string[];
      current: TState;
      desired: TDesired;
    }
  | {
      kind: "delete";
      resource: string;
      key: string;
      dependsOn: readonly string[];
      current: TState;
    };

export interface Plan {
  readonly actions: readonly PlanAction[];
}

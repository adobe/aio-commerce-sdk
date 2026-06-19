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

export type ProviderOutputs = Record<string, unknown>;
export type UpstreamOutputs = ReadonlyMap<string, ProviderOutputs>;

export type DiffResult<TDesired, TState> =
  | { kind: "noop" }
  | { kind: "create"; desired: TDesired }
  | { kind: "update"; current: TState; desired: TDesired }
  | { kind: "replace"; current: TState; desired: TDesired };

export interface Resource<TConfig, TDesired, TState> {
  check(config: TConfig): Promise<readonly TDesired[]>;
  create(desired: TDesired, upstream: UpstreamOutputs): Promise<TState>;
  delete(id: string, current: TState): Promise<void>;
  readonly dependsOn: readonly string[];
  diff(current: TState | null, desired: TDesired): DiffResult<TDesired, TState>;
  keyFromDesired(desired: TDesired): string;
  keyFromState(state: TState): string;
  readonly kind: string;

  list?(): Promise<TState[]>;

  outputs?(states: readonly TState[]): ProviderOutputs;
  update?(
    id: string,
    current: TState,
    desired: TDesired,
    upstream: UpstreamOutputs,
  ): Promise<TState>;
}

export interface Provider<TConfig> {
  readonly name: string;
  readonly resources: readonly Resource<TConfig, unknown, unknown>[];
}

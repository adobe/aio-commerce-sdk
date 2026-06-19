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

/** The declared desired state for a single Commerce webhook subscription. */
export type WebhookConfig = {
  readonly webhook_method: string;
  readonly webhook_type: string;
  readonly batch_name: string;
  readonly hook_name: string;
  readonly url: string;
  readonly required?: boolean;
  readonly priority?: number;
  readonly soft_timeout?: number;
  readonly timeout?: number;
  readonly method?: string;
  readonly fields?: ReadonlyArray<{
    readonly name: string;
    readonly source?: string;
  }>;
  readonly rules?: ReadonlyArray<{
    readonly field: string;
    readonly operator: string;
    readonly value: string;
  }>;
  readonly headers?: ReadonlyArray<{
    readonly name: string;
    readonly value: string;
  }>;
};

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

import type { UpstreamOutputs } from "@aio-commerce-sdk/iacly";

type IoEventsProviderOutput = { readonly providerId: string };

export const IoEventsOutputs = {
  provider(
    upstream: UpstreamOutputs,
    instanceId: string,
  ): IoEventsProviderOutput {
    const map = upstream.get("io-events/provider") as
      | Record<string, IoEventsProviderOutput>
      | undefined;
    const result = map?.[instanceId];
    if (!result) {
      throw new Error(
        `No io-events/provider output found for instanceId "${instanceId}"`,
      );
    }
    return result;
  },
} as const;

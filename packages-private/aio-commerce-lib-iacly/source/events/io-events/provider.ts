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

import { IoEventsEventMetadataResource } from "./event-metadata-resource";
import { IoEventsProviderResource } from "./provider-resource";

import type { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import type { Provider } from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../index";
import type { IoEventsOrgContext } from "./types";

export class IOEventsProvider implements Provider<LibIaclyConfig> {
  public readonly name = "io-events";
  public readonly resources: readonly [
    IoEventsProviderResource,
    IoEventsEventMetadataResource,
  ];

  public constructor(client: AdobeIoEventsHttpClient, org: IoEventsOrgContext) {
    this.resources = [
      new IoEventsProviderResource(client, org),
      new IoEventsEventMetadataResource(client, org),
    ];
  }
}

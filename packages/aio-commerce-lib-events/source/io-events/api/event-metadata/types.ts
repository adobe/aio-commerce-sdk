/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { CamelCasedPropertiesDeep } from "type-fest";
import type { HALLink } from "#io-events/types";

/** Defines the base fields of an event metadata entity. */
export type IoEventMetadata = {
  description: string;
  label: string;
  event_code: string;
};

/** Defines the fields of a sample event entity returned by the Adobe I/O Events API. */
export type SampleEventHalModel = {
  format: string;
  sample_payload?: string;
  _links: {
    self: HALLink;
  };
};

/** Defines the fields of an event metadata entity returned by the Adobe I/O Events API. */
export type IoEventMetadataHalModel = IoEventMetadata & {
  _embedded?: {
    sample_event?: SampleEventHalModel;
  };
  _links: {
    "rel:sample_event"?: HALLink;
    "rel:update"?: HALLink;
    self: HALLink;
  };
};

/** Defines the fields of an event metadata entity returned by the Adobe I/O Events API. */
export type IoEventMetadataOneResponse =
  CamelCasedPropertiesDeep<IoEventMetadataHalModel>;

/** Defines the fields of many event metadata entities returned by the Adobe I/O Events API. */
export type IoEventMetadataManyResponse = CamelCasedPropertiesDeep<{
  _embedded: IoEventMetadataHalModel[];
}>;

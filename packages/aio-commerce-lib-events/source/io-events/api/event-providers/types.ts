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

import type { IoEventMetadataHalModel } from "#io-events/api/event-metadata/types";
import type { HALLink } from "#io-events/types";

/** Defines the base fields of an I/O event provider entity. */
export type IoEventProvider = {
  id: string;
  instance_id?: string;
  label: string;
  source: string;
  publisher: string;
  provider_metadata: string;
  event_delivery_format: string;
  description?: string;
  docs_url?: string;
};

/** Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API. */
export type IoEventProviderHalModel = IoEventProvider & {
  _embedded?: {
    eventmetadata: IoEventMetadataHalModel[];
  };
  _links: {
    self: HALLink;
    "rel:eventmetadata"?: HALLink;
  };
};

/** Defines the fields of an I/O event provider entity returned by the Adobe I/O Events API. */
export type IoEventProviderOneResponse = IoEventProviderHalModel;

/** Defines the fields of many I/O event provider entities returned by the Adobe I/O Events API. */
export type IoEventProviderManyResponse = {
  _embedded: {
    providers: IoEventProviderHalModel[];
  };
  _links: {
    self: HALLink;
  };
};

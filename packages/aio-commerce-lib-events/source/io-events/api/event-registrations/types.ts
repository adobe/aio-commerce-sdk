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

/** Defines the delivery type for event registrations. */
export type DeliveryType =
  | "webhook"
  | "webhook_batch"
  | "journal"
  | "aws_eventbridge";

/** Defines the events of interest for a registration. */
export type EventsOfInterest = {
  provider_id: string;
  event_code: string;
  provider_metadata_id?: string;
};

/** Defines the destination metadata for AWS EventBridge delivery. */
export type DestinationMetadata = {
  aws_region?: string;
  aws_account_id?: string;
};

/** Defines a subscriber-defined filter. */
export type SubscriberFilterModel = {
  id?: string;
  name: string;
  description?: string;
  subscriber_filter: string;
};

/** Defines the base fields of an I/O event registration entity. */
export type IoEventRegistration = {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  parent_client_id?: string;
  webhook_url?: string;
  status: string;
  type: string;
  integration_status: string;
  events_of_interest: EventsOfInterest[];
  registration_id: string;
  delivery_type: DeliveryType;
  events_url?: string;
  runtime_action?: string;
  enabled?: boolean;
  created_date?: string;
  updated_date?: string;
  destination_metadata?: DestinationMetadata;
  subscriber_filters?: SubscriberFilterModel[];
};

/** Defines the fields of an I/O event registration entity returned by the Adobe I/O Events API. */
export type IoEventRegistrationHalModel = IoEventRegistration & {
  _links: {
    self: HALLink;
    "rel:events"?: HALLink;
    "rel:update"?: HALLink;
    "rel:delete"?: HALLink;
  };
};

/** Defines the fields of an I/O event registration entity returned by the Adobe I/O Events API. */
export type IoEventRegistrationOneResponse =
  CamelCasedPropertiesDeep<IoEventRegistrationHalModel>;

/** Defines the pagination metadata for paginated responses. */
export type PageMetadata = {
  size: number;
  number: number;
  numberOfElements: number;
  totalElements: number;
  totalPages: number;
};

/** Defines the fields of many I/O event registration entities returned by the Adobe I/O Events API (workspace-specific). */
export type IoEventRegistrationManyResponse = CamelCasedPropertiesDeep<{
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    self: HALLink;
  };
}>;

/** Defines the fields of paginated I/O event registration entities returned by the Adobe I/O Events API (consumer org-level). */
export type IoEventRegistrationPaginatedResponse = CamelCasedPropertiesDeep<{
  page: PageMetadata;
  _embedded: {
    registrations: IoEventRegistrationHalModel[];
  };
  _links: {
    first?: HALLink;
    last?: HALLink;
    next?: HALLink;
    prev?: HALLink;
    self: HALLink;
  };
}>;

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

/** Defines the structure of a field in a Commerce event subscription. */
export type CommerceEventSubscriptionField = {
  name: string;
  converter?: string;
};

/** Defines the structure of a filtering rule in a Commerce event subscription. */
export type CommerceEventSubscriptionRule = {
  field: string;
  value: string;
  operator: string;
};

/** Defines the structure of a Commerce event subscription. */
export type CommerceEventSubscription = {
  name: string;
  parent: string;
  provider_id: "default" | string;

  fields: CommerceEventSubscriptionField[];
  rules: CommerceEventSubscriptionRule[];

  destination: "default" | string;
  priority: boolean;
  hipaa_audit_required: boolean;
};

/** Defines the fields of an event subscription entity returned by the Commerce API. */
export type CommerceEventSubscriptionOneResponse =
  CamelCasedPropertiesDeep<CommerceEventSubscription>;

/** Defines the fields of many event subscription entities returned by the Commerce API. */
export type CommerceEventSubscriptionManyResponse =
  CommerceEventSubscriptionOneResponse[];

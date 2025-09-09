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

import * as v from "valibot";

import { booleanValueSchema, stringValueSchema } from "#utils/schemas";

function fieldsSchema(propertyName: string) {
  return v.array(
    v.object({
      name: stringValueSchema(`${propertyName}[i].name`),
    }),
    `Expected an array of objects with a 'name' property for the property "${propertyName}"`,
  );
}

export const EventSubscriptionCreateParamsSchema = v.object({
  name: stringValueSchema("name"),

  providerId: v.optional(stringValueSchema("providerId")),
  parent: v.optional(stringValueSchema("parent")),
  fields: fieldsSchema("fields"),

  destination: v.optional(stringValueSchema("destination")),
  hipaaAuditRequired: v.optional(booleanValueSchema("hipaaAuditRequired")),
  prioritary: v.optional(booleanValueSchema("prioritary")),

  force: v.optional(booleanValueSchema("force")),
});

/**
 * The schema of the parameters received by the POST `eventing/eventSubscribe` Commerce API endpoint.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#subscribe-to-events
 */
export type EventSubscriptionCreateParams = v.InferInput<
  typeof EventSubscriptionCreateParamsSchema
>;

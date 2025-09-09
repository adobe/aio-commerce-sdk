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

import { workspaceConfigurationSchema } from "#commerce/lib/schema";
import { stringValueSchema } from "#utils/schemas";

export const EventProviderGetByIdParamsSchema = v.object({
  providerId: stringValueSchema("providerId"),
});

export const EventProviderCreateParamsSchema = v.object({
  providerId: stringValueSchema("providerId"),
  instanceId: stringValueSchema("instanceId"),

  label: v.optional(stringValueSchema("label")),
  description: v.optional(stringValueSchema("description")),
  associatedWorkspaceConfiguration: v.optional(
    workspaceConfigurationSchema("associatedWorkspaceConfiguration"),
  ),
});

/**
 * The schema of the parameters received by the GET `eventing/eventProvider/:id` Commerce API endpoint.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#get-event-provider-by-id
 */
export type EventProviderGetByIdParams = v.InferInput<
  typeof EventProviderGetByIdParamsSchema
>;

/**
 * The schema of the parameters received by the POST `eventing/eventProvider` Commerce API endpoint.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#create-an-event-provider
 */
export type EventProviderCreateParams = v.InferInput<
  typeof EventProviderCreateParamsSchema
>;

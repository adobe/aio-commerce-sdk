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

import {
  booleanValueSchema,
  stringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import {
  DataResidencyRegionSchema,
  EventProviderTypeSchema,
} from "#io-events/lib/schema";

export const EventProviderListAllParamsSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
  withEventMetadata: v.optional(booleanValueSchema("withEventMetadata")),

  filterBy: v.optional(
    v.object({
      instanceId: v.optional(stringValueSchema("instanceId")),
      providerTypes: v.optional(
        v.union([
          v.array(
            EventProviderTypeSchema,
            "Expected an array of event provider types",
          ),
        ]),
      ),
    }),
  ),
});

export const EventProviderGetByIdParamsSchema = v.object({
  providerId: stringValueSchema("providerId"),
  withEventMetadata: v.optional(booleanValueSchema("withEventMetadata")),
});

export const EventProviderCreateParamsSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
  projectId: stringValueSchema("projectId"),
  workspaceId: stringValueSchema("workspaceId"),

  label: stringValueSchema("label"),
  description: v.optional(stringValueSchema("description")),
  docsUrl: v.optional(stringValueSchema("docsUrl")),
  instanceId: v.optional(stringValueSchema("instanceId")),

  providerType: v.optional(EventProviderTypeSchema),
  dataResidencyRegion: v.optional(DataResidencyRegionSchema),
});

/**
 * Defines the parameters received by the GET `providers` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersByConsumerOrgId
 */
export type EventProviderListAllParams = v.InferInput<
  typeof EventProviderListAllParamsSchema
>;

/**
 * The schema of the parameters received by the GET `providers/:id` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersById
 */
export type EventProviderGetByIdParams = v.InferInput<
  typeof EventProviderGetByIdParamsSchema
>;

/**
 * The schema of the parameters received by the POST `providers` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 */
export type EventProviderCreateParams = v.InferInput<
  typeof EventProviderCreateParamsSchema
>;

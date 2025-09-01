import * as v from "valibot";

import {
  DataResidencyRegionSchema,
  EventProviderTypeSchema,
} from "~/api/io-events/schema";
import { booleanValueSchema, stringValueSchema } from "~/utils/schemas";

export const EventProviderListAllParamsSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
  withEventMetadata: v.optional(booleanValueSchema("withEventMetadata")),

  filterBy: v.optional(
    v.object({
      instanceId: v.optional(stringValueSchema("instanceId")),
      providerType: v.optional(
        v.union([EventProviderTypeSchema, v.array(EventProviderTypeSchema)]),
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
export type EventProviderListAllParams = v.InferOutput<
  typeof EventProviderListAllParamsSchema
>;

/**
 * The schema of the parameters received by the GET `providers/:id` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/getProvidersById
 */
export type EventProviderGetByIdParams = v.InferOutput<
  typeof EventProviderGetByIdParamsSchema
>;

/**
 * The schema of the parameters received by the POST `providers` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/createProvider
 */
export type EventProviderCreateParams = v.InferOutput<
  typeof EventProviderCreateParamsSchema
>;

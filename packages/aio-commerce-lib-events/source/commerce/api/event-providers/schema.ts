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

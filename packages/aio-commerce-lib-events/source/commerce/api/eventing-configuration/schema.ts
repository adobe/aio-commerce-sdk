import * as v from "valibot";

import { workspaceConfigurationSchema } from "#commerce/lib/schema";
import {
  alphaNumericOrUnderscoreOrHyphenSchema,
  alphaNumericOrUnderscoreSchema,
  booleanValueSchema,
} from "#utils/schemas";

/** The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint. */
export const UpdateEventingConfigurationParamsSchema = v.partial(
  v.object({
    enabled: booleanValueSchema("enabled"),
    providerId: alphaNumericOrUnderscoreOrHyphenSchema("providerId"),
    instanceId: alphaNumericOrUnderscoreOrHyphenSchema("instanceId"),
    merchantId: alphaNumericOrUnderscoreSchema("merchantId"),
    environmentId: alphaNumericOrUnderscoreSchema("environmentId"),
    workspaceConfiguration: workspaceConfigurationSchema(
      "workspaceConfiguration",
    ),
  }),
);

/**
 * Defines the parameters received by the `updateConfiguration` Commerce Eventing API endpoint.
 * @see https://developer.adobe.com/commerce/extensibility/events/api/#configure-commerce-eventing
 */
export type UpdateEventingConfigurationParams = v.InferInput<
  typeof UpdateEventingConfigurationParamsSchema
>;

import * as v from "valibot";

import { workspaceConfigurationSchema } from "~/commerce/lib/schema";
import {
  alphaNumericOrUnderscoreOrHyphenSchema,
  alphaNumericOrUnderscoreSchema,
} from "~/utils/schemas";

/** The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint. */
export const UpdateEventingConfigurationParamsSchema = v.partial(
  v.object({
    /** Whether the eventing is enabled. */
    enabled: v.boolean('Expected a boolean value for property "enabled"'),

    /** The ID of the provider in Adobe I/O Events. */
    providerId: alphaNumericOrUnderscoreOrHyphenSchema("providerId"),

    /** The instance ID of the provider in Adobe I/O Events. */
    instanceId: alphaNumericOrUnderscoreOrHyphenSchema("instanceId"),

    /** The merchant ID of the provider in Adobe I/O Events. */
    merchantId: alphaNumericOrUnderscoreSchema("merchantId"),

    /** The environment ID of the provider in Adobe I/O Events. */
    environmentId: alphaNumericOrUnderscoreSchema("environmentId"),

    /** The workspace configuration downloaded from your project in the Developer Console. */
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

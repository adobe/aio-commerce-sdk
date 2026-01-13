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
  alphaNumericOrUnderscoreOrHyphenSchema,
  alphaNumericOrUnderscoreSchema,
  booleanValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import { workspaceConfigurationSchema } from "#commerce/lib/schema";

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

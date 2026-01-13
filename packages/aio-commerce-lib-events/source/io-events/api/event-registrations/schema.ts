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

/** Valid delivery types for event registrations. */
const VALID_DELIVERY_TYPES = [
  "webhook",
  "webhook_batch",
  "journal",
  "aws_eventbridge",
] as const;

/** Regex pattern for AWS region validation. */
const AWS_REGION_REGEX = /^(us|ca|eu|af|ap|cn|me|sa|il)-[a-z]+-\d$/;

/** Regex pattern for AWS account ID validation (12 digits). */
const AWS_ACCOUNT_ID_REGEX = /^\d{12}$/;

/** Schema for delivery type validation. */
export const DeliveryTypeSchema = v.picklist(
  VALID_DELIVERY_TYPES,
  `Expected delivery type to be one of: ${VALID_DELIVERY_TYPES.join(", ")}`,
);

/** Schema for events of interest. */
export const EventsOfInterestSchema = v.object({
  providerId: stringValueSchema("providerId"),
  eventCode: stringValueSchema("eventCode"),
  providerMetadataId: v.optional(stringValueSchema("providerMetadataId")),
});

/** Schema for AWS EventBridge destination metadata. */
export const DestinationMetadataSchema = v.object({
  awsRegion: v.optional(
    v.pipe(
      stringValueSchema("awsRegion"),
      v.regex(
        AWS_REGION_REGEX,
        "Expected AWS region in format like 'us-east-1'",
      ),
    ),
  ),
  awsAccountId: v.optional(
    v.pipe(
      stringValueSchema("awsAccountId"),
      v.regex(
        AWS_ACCOUNT_ID_REGEX,
        "Expected AWS account ID to be a 12-digit number",
      ),
    ),
  ),
});

/** Schema for subscriber-defined filter. */
export const SubscriberFilterSchema = v.object({
  name: v.pipe(
    stringValueSchema("name"),
    v.minLength(
      3,
      "Expected subscriber filter name to be at least 3 characters",
    ),
    v.maxLength(
      80,
      "Expected subscriber filter name to be at most 80 characters",
    ),
  ),
  description: v.optional(
    v.pipe(
      stringValueSchema("description"),
      v.maxLength(
        250,
        "Expected subscriber filter description to be at most 250 characters",
      ),
    ),
  ),
  subscriberFilter: stringValueSchema("subscriberFilter"),
});

/** Shared schema for workspace path parameters. */
const WorkspacePathParamsSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
  projectId: stringValueSchema("projectId"),
  workspaceId: stringValueSchema("workspaceId"),
});

/** Shared schema for events of interest array field. */
const EventsOfInterestArraySchema = v.pipe(
  v.array(
    EventsOfInterestSchema,
    "Expected eventsOfInterest to be an array of event interest objects",
  ),
  v.minLength(1, "Expected at least one event of interest"),
);

/** Shared schema for registration body fields. */
const RegistrationBodySchema = v.object({
  clientId: v.pipe(
    stringValueSchema("clientId"),
    v.minLength(3, "Expected clientId to be at least 1 character"),
    v.maxLength(255, "Expected clientId to be at most 255 characters"),
  ),
  name: v.pipe(
    stringValueSchema("name"),
    v.minLength(3, "Expected registration name to be at least 3 characters"),
    v.maxLength(255, "Expected registration name to be at most 255 characters"),
  ),
  description: v.optional(
    v.pipe(
      stringValueSchema("description"),
      v.maxLength(5000, "Expected description to be at most 5000 characters"),
    ),
  ),
  webhookUrl: v.optional(
    v.pipe(
      stringValueSchema("webhookUrl"),
      v.maxLength(4000, "Expected webhook URL to be at most 4000 characters"),
    ),
  ),
  eventsOfInterest: EventsOfInterestArraySchema,
  deliveryType: DeliveryTypeSchema,
  runtimeAction: v.optional(
    v.pipe(
      stringValueSchema("runtimeAction"),
      v.maxLength(255, "Expected runtime action to be at most 255 characters"),
    ),
  ),
  enabled: v.optional(booleanValueSchema("enabled")),
  destinationMetadata: v.optional(DestinationMetadataSchema),
  subscriberFilters: v.optional(
    v.pipe(
      v.array(
        SubscriberFilterSchema,
        "Expected subscriberFilters to be an array of subscriber filter objects",
      ),
      v.maxLength(1, "Expected at most 1 subscriber filter"),
    ),
  ),
});

/** Schema for getting all registrations for a workspace. */
export const GetAllRegistrationsParamsSchema = WorkspacePathParamsSchema;

/** Schema for getting all registrations for a consumer organization. */
export const GetAllRegistrationsByConsumerOrgParamsSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
});

/** Schema for getting a registration by ID. */
export const GetRegistrationByIdParamsSchema = v.object({
  ...WorkspacePathParamsSchema.entries,
  registrationId: stringValueSchema("registrationId"),
});

/** Schema for creating a registration. */
export const CreateRegistrationParamsSchema = v.object({
  ...WorkspacePathParamsSchema.entries,
  ...RegistrationBodySchema.entries,
});

/** Schema for updating a registration. */
export const UpdateRegistrationParamsSchema = v.object({
  ...WorkspacePathParamsSchema.entries,
  registrationId: stringValueSchema("registrationId"),
  ...RegistrationBodySchema.entries,
});

/** Schema for deleting a registration. */
export const DeleteRegistrationParamsSchema = v.object({
  ...WorkspacePathParamsSchema.entries,
  registrationId: stringValueSchema("registrationId"),
});

/**
 * The parameters for getting all registrations for a workspace.
 * @see https://developer.adobe.com/events/docs/api#operation/getAllRegistrations
 */
export type GetAllRegistrationsParams = v.InferInput<
  typeof GetAllRegistrationsParamsSchema
>;

/**
 * The parameters for getting all registrations for a consumer organization.
 * @see https://developer.adobe.com/events/docs/api#operation/getAllRegistrationsForOrg
 */
export type GetAllRegistrationsByConsumerOrgParams = v.InferInput<
  typeof GetAllRegistrationsByConsumerOrgParamsSchema
>;

/**
 * The parameters for getting a registration by ID.
 * @see https://developer.adobe.com/events/docs/api#operation/getRegistration
 */
export type GetRegistrationByIdParams = v.InferInput<
  typeof GetRegistrationByIdParamsSchema
>;

/**
 * The parameters for creating a registration.
 * @see https://developer.adobe.com/events/docs/api#operation/createRegistration
 */
export type CreateRegistrationParams = v.InferInput<
  typeof CreateRegistrationParamsSchema
>;

/**
 * The parameters for updating a registration.
 * @see https://developer.adobe.com/events/docs/api#operation/updateRegistration
 */
export type UpdateRegistrationParams = v.InferInput<
  typeof UpdateRegistrationParamsSchema
>;

/**
 * The parameters for deleting a registration.
 * @see https://developer.adobe.com/events/docs/api#operation/deleteRegistration
 */
export type DeleteRegistrationParams = v.InferInput<
  typeof DeleteRegistrationParamsSchema
>;

/**
 * The subscriber-defined filter for a registration.
 */
export type SubscriberFilter = v.InferInput<typeof SubscriberFilterSchema>;

/**
 * The delivery type for a registration.
 */
export type DeliveryType = v.InferOutput<typeof DeliveryTypeSchema>;

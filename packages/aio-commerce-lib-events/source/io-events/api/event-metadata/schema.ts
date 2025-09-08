import * as v from "valibot";

import { stringValueSchema } from "#utils/schemas";

const BASE64_ENCODED_STRING_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const BASE64_ENCODED_STRING_LENGTH_REMAINDER = 4;

function isBase64EncodedString(value: string) {
  return (
    BASE64_ENCODED_STRING_REGEX.test(value) &&
    value.length % BASE64_ENCODED_STRING_LENGTH_REMAINDER === 0
  );
}

function encodeToBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

function tryDecodeFromBase64(value: string) {
  if (isBase64EncodedString(value)) {
    return Buffer.from(value, "base64").toString("utf-8");
  }

  return value;
}

function sampleEventTemplateSchema(fieldName: string) {
  return v.pipe(
    // Input Format (JSON String or Object or Array)
    v.union([
      v.pipe(
        // Sample event templates should be strings (encoded or not) (containing valid JSON data)
        stringValueSchema(fieldName),
        v.transform(tryDecodeFromBase64),
        v.parseJson(
          undefined,
          `Expected valid JSON string for property '${fieldName}'`,
        ),

        // After checking if valid, convert back to string
        v.record(v.string(), v.unknown()),
        v.stringifyJson(),
      ),

      v.record(v.string(), v.unknown()),
      v.array(v.unknown()),
    ]),

    // Output Format (JSON String)
    v.stringifyJson(
      undefined,
      `Expected valid JSON data for property '${fieldName}'`,
    ),

    // Encoded to Base64
    v.transform(encodeToBase64),
  );
}

/** The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint. */
export const GetAllEventMetadataForProviderSchema = v.object({
  providerId: stringValueSchema("providerId"),
});

/** The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint. */
export const GetEventMetadataForEventAndProviderSchema = v.object({
  eventCode: stringValueSchema("eventCode"),
  providerId: stringValueSchema("providerId"),
});

/** The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint. */
export const CreateEventMetadataForProviderSchema = v.object({
  consumerOrgId: stringValueSchema("consumerOrgId"),
  projectId: stringValueSchema("projectId"),
  workspaceId: stringValueSchema("workspaceId"),
  providerId: stringValueSchema("providerId"),

  label: stringValueSchema("label"),
  description: stringValueSchema("description"),
  eventCode: stringValueSchema("eventCode"),
  sampleEventTemplate: v.optional(
    sampleEventTemplateSchema("sampleEventTemplate"),
  ),
});

/**
 * The schema of the parameters received by the GET `providers/:id/eventmetadata` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderId
 */
export type GetAllEventMetadataForProviderParams = v.InferInput<
  typeof GetAllEventMetadataForProviderSchema
>;

/**
 * The schema of the parameters received by the GET `providers/:id/eventmetadata/:code` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/getByProviderIdAndEventCode
 */
export type GetEventMetadataForEventAndProviderParams = v.InferInput<
  typeof GetEventMetadataForEventAndProviderSchema
>;

/**
 * The schema of the parameters received by the POST `providers/:id/eventmetadata` Adobe I/O Events API endpoint.
 * @see https://developer.adobe.com/events/docs/api#operation/postEventMetadata
 */
export type CreateEventMetadataForProviderParams = v.InferInput<
  typeof CreateEventMetadataForProviderSchema
>;

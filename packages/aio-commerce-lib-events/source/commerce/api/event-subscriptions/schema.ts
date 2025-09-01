import * as v from "valibot";

import { booleanValueSchema, stringValueSchema } from "~/utils/schemas";

function fieldsSchema(propertyName: string) {
  return v.union([
    v.pipe(
      v.literal("*"),
      v.transform(() => [
        {
          name: "*",
        },
      ]),
    ),
    v.union([
      v.pipe(
        // @TODO: Implement converters?
        v.array(
          v.string(
            `Expected only string values for the names in the property "${propertyName}"`,
          ),
          `Expected an array of string values for the property "${propertyName}"`,
        ),
        v.minLength(1, `${propertyName} array must not be empty`),
        v.transform((fields) =>
          fields.map((field) => {
            const trimmedField = field.trim();
            return {
              name: trimmedField,
            };
          }),
        ),
      ),
      v.array(
        v.object({
          name: stringValueSchema(`${propertyName}[i].name`),
        }),
        `Expected an array of objects with a 'name' property for the property "${propertyName}"`,
      ),
    ]),
  ]);
}

// @TODO: Implement rules?
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

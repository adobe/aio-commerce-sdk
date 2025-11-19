import * as v from "valibot";

const ListOptionSchema = v.object({
  label: v.string(),
  value: v.string(),
});

const SingleListSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("list"),
  selectionMode: v.literal("single"),
  options: v.array(ListOptionSchema),
  default: v.pipe(v.string(), v.nonEmpty()),
  description: v.optional(v.string()),
});

const MultipleListSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("list"),
  selectionMode: v.literal("multiple"),
  options: v.array(ListOptionSchema),
  default: v.array(v.pipe(v.string(), v.nonEmpty())),
  description: v.optional(v.string()),
});

const ListSchema = v.variant("selectionMode", [
  SingleListSchema,
  MultipleListSchema,
]);

const TextSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("text"),
  default: v.optional(v.string()),
  description: v.optional(v.string()),
});

const FieldSchema = v.variant("type", [ListSchema, TextSchema]);

/** An array of schema configurations. */
export const BusinessConfigSchema = v.pipe(
  v.array(FieldSchema),
  v.minLength(1, "At least one configuration parameter is required"),
);

/** The schema for a configuration field. */
export type ConfigSchemaField = v.InferInput<typeof FieldSchema>;

/** The schema for the own business configuration schema. */
export type BusinessConfigSchema = v.InferInput<typeof BusinessConfigSchema>;

/** The schema for an option for a list configuration field. */
export type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  { type: "list" }
>["options"][number];

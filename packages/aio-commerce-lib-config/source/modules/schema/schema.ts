import * as v from "valibot";

const ListOptionSchema = v.object({
  label: v.string(),
  value: v.string(),
});

const ListSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("list"),
  selectionMode: v.optional(
    v.union([v.literal("single"), v.literal("multiple")]),
    "single",
  ),
  options: v.array(ListOptionSchema),
  default: v.pipe(v.string(), v.nonEmpty()),
  description: v.optional(v.string()),
});

const TextSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("text"),
  default: v.optional(v.string()),
  description: v.optional(v.string()),
});

const VariantTypeSchema = v.variant("type", [ListSchema, TextSchema]);

/** An array of schema configurations. */
export const RootSchema = v.pipe(
  v.array(VariantTypeSchema),
  v.minLength(1, "At least one configuration parameter is required"),
);

/** The schema for a configuration field. */
export type ConfigSchemaField = v.InferInput<typeof VariantTypeSchema>;

/** The schema for an option for a list configuration field. */
export type ConfigSchemaOption = Extract<
  ConfigSchemaField,
  { type: "list" }
>["options"][number];

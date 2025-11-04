import * as v from "valibot";

export const ListOptionSchema = v.object({
  label: v.string(),
  value: v.string(),
});

export const ListSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("list"),
  options: v.array(ListOptionSchema),
  default: v.pipe(v.string(), v.nonEmpty()),
  description: v.optional(v.string()),
});

export const TextSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty()),
  label: v.optional(v.string()),
  type: v.literal("text"),
  default: v.optional(v.string()),
  description: v.optional(v.string()),
});

export const VariantTypeSchema = v.variant("type", [ListSchema, TextSchema]);

export const RootSchema = v.pipe(
  v.array(VariantTypeSchema),
  v.minLength(1, "At least one configuration parameter is required"),
);

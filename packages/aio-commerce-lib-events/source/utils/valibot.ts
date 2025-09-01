import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

/**
 * Parses the input using the provided schema and throws a {@link CommerceSdkValidationError} error if the input is invalid.
 * @param schema - The schema to use for parsing.
 * @param input - The input to parse.
 */
export function parseOrThrow<
  const TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema, input: unknown): InferOutput<TSchema> {
  const result = v.safeParse(schema, input);
  if (!result.success) {
    throw new CommerceSdkValidationError("Invalid input", {
      issues: result.issues,
    });
  }

  return result.output;
}

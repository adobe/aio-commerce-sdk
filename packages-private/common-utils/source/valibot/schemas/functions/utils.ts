/*
 * Copyright 2026 Adobe. All rights reserved.
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

export const NO_ARGS_MESSAGE = "Expected no arguments for this function";
const INVALID_ARGS_MESSAGE =
  "The given arguments do not match the expected function signature";

export const NO_OUTPUT_MESSAGE = "Expected no output from this function";
export const INVALID_OUTPUT_MESSAGE =
  "The function does not return the expected output";

export const INVALID_FUNCTION_MESSAGE = "The value is not a valid function";

export function createArgumentIssuePrefix(issue: v.BaseIssue<unknown>) {
  const dotPath = v.getDotPath(issue);

  if (!dotPath) {
    return `${INVALID_ARGS_MESSAGE} → arguments`;
  }

  // For args, Valibot doesn't know the argument names, so the path is based on the argument index
  // (e.g. "0" for the first argument) and any nested properties (e.g. "0.name" for a "name" property on the first argument).
  // This function converts that into a more user-friendly message like "argument 1" instead of "arguments.0".
  const [firstSegment, ...restSegments] = dotPath.split(".");
  const argumentIndex = Number(firstSegment);

  if (!Number.isInteger(argumentIndex)) {
    return `${INVALID_ARGS_MESSAGE} → arguments.${dotPath}`;
  }

  const nestedPath =
    restSegments.length > 0 ? `.${restSegments.join(".")}` : "";

  return `${INVALID_ARGS_MESSAGE} → arguments[${argumentIndex}]${nestedPath}`;
}

/** A schema for a function that may return either a direct value or a promise-like value. */
export type AnyTupleSchema = v.TupleSchema<
  v.TupleItems,
  v.ErrorMessage<v.TupleIssue> | undefined
>;

/**
 * Options for creating a function schema, including optional argument and output schemas and a custom message.
 * @template ArgsSchema The schema for the function arguments, which must be a tuple schema or undefined.
 * @template OutputSchema The schema for the function output, which must be a Valibot generic schema or undefined.
 */
export type FunctionSchemaOptions<
  ArgsSchema extends AnyTupleSchema | undefined,
  OutputSchema extends v.GenericSchema | undefined,
> = {
  args?: ArgsSchema;
  output?: OutputSchema;
  message?: string;
};

/**
 * Convenience type for an options object which only allows configuring the args for a function schema.
 * @template ArgsSchema The schema for the function arguments, which must be a tuple schema.
 */
export type OnlyArgsFunctionSchemaOptions<
  ArgsSchema extends AnyTupleSchema | undefined,
> = Omit<FunctionSchemaOptions<ArgsSchema, undefined>, "output">;

type AnyFunction = (...args: never[]) => unknown;
export type FunctionSchema<
  TInput extends AnyFunction,
  TOutput extends AnyFunction,
> = v.BaseSchema<TInput, TOutput, v.BaseIssue<unknown>>;

export type FunctionSchemaWithoutArgs<CallbackReturn, WrappedReturn> =
  FunctionSchema<() => CallbackReturn, () => WrappedReturn>;

export type FunctionSchemaWithArgs<
  ArgsSchema extends AnyTupleSchema,
  CallbackReturn,
  WrappedReturn,
> = FunctionSchema<
  (...args: v.InferOutput<ArgsSchema>) => CallbackReturn,
  (...args: v.InferInput<ArgsSchema>) => WrappedReturn
>;

export function functionBase<TFunction extends AnyFunction>(message: string) {
  // v.custom<T> lets us declare the callback type that enters Valibot's function pipeline
  // rather than erasing to (...args: unknown[]) => unknown as v.function() does.
  return v.custom<TFunction>((value) => typeof value === "function", message);
}

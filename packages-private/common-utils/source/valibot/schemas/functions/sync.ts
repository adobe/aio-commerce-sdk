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

import { withPrefixedMessage } from "../../messages";
import {
  createArgumentIssuePrefix,
  functionBase,
  INVALID_FUNCTION_MESSAGE,
  INVALID_OUTPUT_MESSAGE,
  NO_ARGS_MESSAGE,
  NO_OUTPUT_MESSAGE,
} from "./utils";

import type {
  AnyTupleSchema,
  FunctionSchemaOptions,
  FunctionSchemaWithArgs,
  FunctionSchemaWithoutArgs,
} from "./utils";

function createSyncFunctionSchema(
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithoutArgs<void, void> {
  return v.pipe(
    functionBase<() => void>(message),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

function createSyncFunctionSchemaWithArgs<ArgsSchema extends AnyTupleSchema>(
  args: ArgsSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithArgs<ArgsSchema, void, void> {
  return v.pipe(
    functionBase<(...args: v.InferOutput<ArgsSchema>) => void>(message),
    v.args(withPrefixedMessage(args, createArgumentIssuePrefix)),
    v.returns(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

function createSyncFunctionSchemaWithOutput<
  OutputSchema extends v.GenericSchema,
>(
  output: OutputSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithoutArgs<
  v.InferInput<OutputSchema>,
  v.InferOutput<OutputSchema>
> {
  return v.pipe(
    functionBase<() => v.InferInput<OutputSchema>>(message),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

function createSyncFunctionSchemaWithArgsAndOutput<
  ArgsSchema extends AnyTupleSchema,
  OutputSchema extends v.GenericSchema,
>(
  args: ArgsSchema,
  output: OutputSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithArgs<
  ArgsSchema,
  v.InferInput<OutputSchema>,
  v.InferOutput<OutputSchema>
> {
  return v.pipe(
    functionBase<
      (...args: v.InferOutput<ArgsSchema>) => v.InferInput<OutputSchema>
    >(message),
    v.args(withPrefixedMessage(args, createArgumentIssuePrefix)),
    v.returns(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

export function syncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
  const OutputSchema extends v.GenericSchema,
>(options: {
  args: ArgsSchema;
  output: OutputSchema;
  message?: string;
}): ReturnType<
  typeof createSyncFunctionSchemaWithArgsAndOutput<ArgsSchema, OutputSchema>
>;

export function syncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
>(options: {
  args: ArgsSchema;
  output?: undefined;
  message?: string;
}): ReturnType<typeof createSyncFunctionSchemaWithArgs<ArgsSchema>>;

export function syncFunctionSchema<
  const OutputSchema extends v.GenericSchema,
>(options: {
  args?: undefined;
  output: OutputSchema;
  message?: string;
}): ReturnType<typeof createSyncFunctionSchemaWithOutput<OutputSchema>>;

export function syncFunctionSchema(options?: {
  args?: undefined;
  output?: undefined;
  message?: string;
}): ReturnType<typeof createSyncFunctionSchema>;

/**
 * Creates a Valibot schema for a synchronous function with optional argument and output schemas.
 * @param options An object describing the arguments and output of the function schema to create.
 *
 * @example
 * ```ts
 * const schema = syncFunctionSchema({
 *   args: v.tuple([v.string()]),
 *   output: v.number(),
 * });
 * ```
 */
export function syncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema | undefined,
  const OutputSchema extends v.GenericSchema | undefined,
>(options?: FunctionSchemaOptions<ArgsSchema, OutputSchema>) {
  if (!options) {
    return createSyncFunctionSchema();
  }

  if (options.args && options.output) {
    return createSyncFunctionSchemaWithArgsAndOutput(
      options.args,
      options.output,
      options.message,
    );
  }

  if (options.args) {
    return createSyncFunctionSchemaWithArgs(options.args, options.message);
  }

  if (options.output) {
    return createSyncFunctionSchemaWithOutput(options.output, options.message);
  }

  return createSyncFunctionSchema(options?.message);
}

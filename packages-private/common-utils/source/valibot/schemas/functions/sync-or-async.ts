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

import { returnsSyncOrAsync } from "../../actions/returns-sync-or-async";
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

type MaybePromiseLike<T> = T | PromiseLike<T>;

function createSyncOrAsyncFunctionSchema(
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithoutArgs<MaybePromiseLike<void>, MaybePromiseLike<void>> {
  return v.pipe(
    functionBase<() => void | PromiseLike<void>>(message),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    returnsSyncOrAsync<[], void | PromiseLike<void>, v.VoidSchema<undefined>>(
      withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE),
    ),
  );
}

function createSyncOrAsyncFunctionSchemaWithArgs<
  ArgsSchema extends AnyTupleSchema,
>(
  args: ArgsSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithArgs<
  ArgsSchema,
  MaybePromiseLike<void>,
  MaybePromiseLike<void>
> {
  return v.pipe(
    functionBase<
      (...args: v.InferOutput<ArgsSchema>) => void | PromiseLike<void>
    >(message),
    v.args(withPrefixedMessage(args, createArgumentIssuePrefix)),
    returnsSyncOrAsync<
      v.InferInput<ArgsSchema>,
      void | PromiseLike<void>,
      v.VoidSchema<undefined>
    >(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

function createSyncOrAsyncFunctionSchemaWithOutput<
  OutputSchema extends v.GenericSchema,
>(
  output: OutputSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithoutArgs<
  MaybePromiseLike<v.InferInput<OutputSchema>>,
  MaybePromiseLike<v.InferOutput<OutputSchema>>
> {
  return v.pipe(
    functionBase<
      () => v.InferInput<OutputSchema> | PromiseLike<v.InferInput<OutputSchema>>
    >(message),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    returnsSyncOrAsync<
      [],
      v.InferInput<OutputSchema> | PromiseLike<v.InferInput<OutputSchema>>,
      OutputSchema
    >(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

function createSyncOrAsyncFunctionSchemaWithArgsAndOutput<
  ArgsSchema extends AnyTupleSchema,
  OutputSchema extends v.GenericSchema,
>(
  args: ArgsSchema,
  output: OutputSchema,
  message = INVALID_FUNCTION_MESSAGE,
): FunctionSchemaWithArgs<
  ArgsSchema,
  MaybePromiseLike<v.InferInput<OutputSchema>>,
  MaybePromiseLike<v.InferOutput<OutputSchema>>
> {
  return v.pipe(
    functionBase<
      (
        ...args: v.InferOutput<ArgsSchema>
      ) => v.InferInput<OutputSchema> | PromiseLike<v.InferInput<OutputSchema>>
    >(message),
    v.args(withPrefixedMessage(args, createArgumentIssuePrefix)),
    returnsSyncOrAsync<
      v.InferInput<ArgsSchema>,
      v.InferInput<OutputSchema> | PromiseLike<v.InferInput<OutputSchema>>,
      OutputSchema
    >(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

export function syncOrAsyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
  const OutputSchema extends v.GenericSchema,
>(options: {
  args: ArgsSchema;
  output: OutputSchema;
  message?: string;
}): ReturnType<
  typeof createSyncOrAsyncFunctionSchemaWithArgsAndOutput<
    ArgsSchema,
    OutputSchema
  >
>;

export function syncOrAsyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
>(options: {
  args: ArgsSchema;
  output?: undefined;
  message?: string;
}): ReturnType<typeof createSyncOrAsyncFunctionSchemaWithArgs<ArgsSchema>>;

export function syncOrAsyncFunctionSchema<
  const OutputSchema extends v.GenericSchema,
>(options: {
  args?: undefined;
  output: OutputSchema;
  message?: string;
}): ReturnType<typeof createSyncOrAsyncFunctionSchemaWithOutput<OutputSchema>>;

export function syncOrAsyncFunctionSchema(options?: {
  args?: undefined;
  output?: undefined;
  message?: string;
}): ReturnType<typeof createSyncOrAsyncFunctionSchema>;

/**
 * Creates a Valibot schema for a function that may return either a direct value or a promise-like value.
 * @param options An object describing the arguments and output of the function schema to create.
 *
 * @example
 * ```ts
 * const schema = syncOrAsyncFunctionSchema({
 *   args: v.tuple([v.string()]),
 *   output: v.number(),
 * });
 * ```
 */
export function syncOrAsyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema | undefined,
  const OutputSchema extends v.GenericSchema | undefined,
>(options?: FunctionSchemaOptions<ArgsSchema, OutputSchema>) {
  if (!options) {
    return createSyncOrAsyncFunctionSchema();
  }

  if (options.args && options.output) {
    return createSyncOrAsyncFunctionSchemaWithArgsAndOutput(
      options.args,
      options.output,
      options.message,
    );
  }

  if (options.args) {
    return createSyncOrAsyncFunctionSchemaWithArgs(
      options.args,
      options.message,
    );
  }

  if (options.output) {
    return createSyncOrAsyncFunctionSchemaWithOutput(
      options.output,
      options.message,
    );
  }

  return createSyncOrAsyncFunctionSchema(options?.message);
}

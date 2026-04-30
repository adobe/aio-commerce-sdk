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

import { returnsSyncOrAsync } from "../actions/returns-sync-or-async";
import { withPrefixedMessage } from "../messages";

const NO_ARGS_MESSAGE = "Expected no arguments for this function";
const INVALID_ARGS_MESSAGE =
  "The given arguments do not match the expected function signature";

const NO_OUTPUT_MESSAGE = "Expected no output from this function";
const INVALID_OUTPUT_MESSAGE =
  "The function does not return the expected output";

const INVALID_FUNCTION_MESSAGE = "The value is not a valid function";

type AnyTupleSchema = v.TupleSchema<
  v.TupleItems,
  v.ErrorMessage<v.TupleIssue> | undefined
>;

type FunctionSchemaOptions<
  ArgsSchema extends AnyTupleSchema | undefined,
  OutputSchema extends v.GenericSchema | undefined,
> = {
  args?: ArgsSchema;
  output?: OutputSchema;
};

/** A schema for a simple synchronous function (no args, no output) */
function createSyncFunctionSchema() {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a synchronous function with arguments.
 * @param args The schema for the function arguments.
 */
function createSyncFunctionSchemaWithArgs<ArgsSchema extends AnyTupleSchema>(
  args: ArgsSchema,
) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a synchronous function with output.
 * @param output The schema for the function output.
 */
function createSyncFunctionSchemaWithOutput<
  OutputSchema extends v.GenericSchema,
>(output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a synchronous function with both arguments and output.
 * @param args A schema for the function arguments.
 * @param output A schema for the function output.
 */
function createSyncFunctionSchemaWithArgsAndOutput<
  ArgsSchema extends AnyTupleSchema,
  OutputSchema extends v.GenericSchema,
>(args: ArgsSchema, output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    v.returns(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

// Overload for function schema with both arguments and output
export function syncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
  const OutputSchema extends v.GenericSchema,
>(options: {
  args: ArgsSchema;
  output: OutputSchema;
}): ReturnType<
  typeof createSyncFunctionSchemaWithArgsAndOutput<ArgsSchema, OutputSchema>
>;

// Overload for sync function schema with only arguments
export function syncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
>(options: {
  args: ArgsSchema;
  output?: undefined;
}): ReturnType<typeof createSyncFunctionSchemaWithArgs<ArgsSchema>>;

// Overload for sync function schema with only output
export function syncFunctionSchema<
  const OutputSchema extends v.GenericSchema,
>(options: {
  args?: undefined;
  output: OutputSchema;
}): ReturnType<typeof createSyncFunctionSchemaWithOutput<OutputSchema>>;

// Overload for sync function schema with no arguments and no output
export function syncFunctionSchema(options?: {
  args?: undefined;
  output?: undefined;
}): ReturnType<typeof createSyncFunctionSchema>;

/**
 * A schema for a synchronous function with optional argument and output schemas.
 * @param options An object describing the arguments and output of the function schema to create.
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
    );
  }

  if (options.args) {
    return createSyncFunctionSchemaWithArgs(options.args);
  }

  if (options.output) {
    return createSyncFunctionSchemaWithOutput(options.output);
  }

  return createSyncFunctionSchema();
}

/** A schema for an asynchronous function with optional argument and output schemas. */
function createAsyncFunctionSchema() {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returnsAsync(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/** A schema for an asynchronous function with arguments. */
function createAsyncFunctionSchemaWithArgs<ArgsSchema extends AnyTupleSchema>(
  args: ArgsSchema,
) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    v.returnsAsync(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/** A schema for an asynchronous function with output. */
function createAsyncFunctionSchemaWithOutput<
  OutputSchema extends v.GenericSchema,
>(output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    v.returnsAsync(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

/** A schema for an asynchronous function with both arguments and output. */
function createAsyncFunctionSchemaWithArgsAndOutput<
  ArgsSchema extends AnyTupleSchema,
  OutputSchema extends v.GenericSchema,
>(args: ArgsSchema, output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    v.returnsAsync(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

// Overload for async function schema with both arguments and output
export function asyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
  const OutputSchema extends v.GenericSchema,
>(options: {
  args: ArgsSchema;
  output: OutputSchema;
}): ReturnType<
  typeof createAsyncFunctionSchemaWithArgsAndOutput<ArgsSchema, OutputSchema>
>;

// Overload for async function schema with only arguments
export function asyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
>(options: {
  args: ArgsSchema;
  output?: undefined;
}): ReturnType<typeof createAsyncFunctionSchemaWithArgs<ArgsSchema>>;

// Overload for async function schema with only output
export function asyncFunctionSchema<
  const OutputSchema extends v.GenericSchema,
>(options: {
  args?: undefined;
  output: OutputSchema;
}): ReturnType<typeof createAsyncFunctionSchemaWithOutput<OutputSchema>>;

// Overload for async function schema with no arguments and no output
export function asyncFunctionSchema(options?: {
  args?: undefined;
  output?: undefined;
}): ReturnType<typeof createAsyncFunctionSchema>;

/**
 * A schema for an asynchronous function with optional argument and output schemas.
 * @param options An object describing the arguments and output of the function schema to create.
 */
export function asyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema | undefined,
  const OutputSchema extends v.GenericSchema | undefined,
>(options?: FunctionSchemaOptions<ArgsSchema, OutputSchema>) {
  if (!options) {
    return createAsyncFunctionSchema();
  }

  if (options.args && options.output) {
    return createAsyncFunctionSchemaWithArgsAndOutput(
      options.args,
      options.output,
    );
  }

  if (options.args) {
    return createAsyncFunctionSchemaWithArgs(options.args);
  }

  if (options.output) {
    return createAsyncFunctionSchemaWithOutput(options.output);
  }

  return createAsyncFunctionSchema();
}

/** A schema for a function that can be either synchronous or asynchronous (no args, no output) */
function createSyncOrAsyncFunctionSchema() {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    returnsSyncOrAsync(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a function that can be either synchronous or asynchronous with arguments.
 * @param args The schema for the function arguments.
 */
function createSyncOrAsyncFunctionSchemaWithArgs<
  ArgsSchema extends AnyTupleSchema,
>(args: ArgsSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    returnsSyncOrAsync(withPrefixedMessage(v.void(), NO_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a function that can be either synchronous or asynchronous with output.
 * @param output The schema for the function output.
 */
function createSyncOrAsyncFunctionSchemaWithOutput<
  OutputSchema extends v.GenericSchema,
>(output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(v.tuple([]), NO_ARGS_MESSAGE)),
    returnsSyncOrAsync(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

/**
 * A schema for a function that can be either synchronous or asynchronous with both arguments and output.
 * @param args The schema for the function arguments.
 * @param output The schema for the function output.
 */
function createSyncOrAsyncFunctionSchemaWithArgsAndOutput<
  ArgsSchema extends AnyTupleSchema,
  OutputSchema extends v.GenericSchema,
>(args: ArgsSchema, output: OutputSchema) {
  return v.pipe(
    v.function(INVALID_FUNCTION_MESSAGE),
    v.args(withPrefixedMessage(args, INVALID_ARGS_MESSAGE)),
    returnsSyncOrAsync(withPrefixedMessage(output, INVALID_OUTPUT_MESSAGE)),
  );
}

// Overload for sync or async function schema with both arguments and output
export function syncOrAsyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
  const OutputSchema extends v.GenericSchema,
>(options: {
  args: ArgsSchema;
  output: OutputSchema;
}): ReturnType<
  typeof createSyncOrAsyncFunctionSchemaWithArgsAndOutput<
    ArgsSchema,
    OutputSchema
  >
>;

// Overload for sync or async function schema with only arguments
export function syncOrAsyncFunctionSchema<
  const ArgsSchema extends AnyTupleSchema,
>(options: {
  args: ArgsSchema;
  output?: undefined;
}): ReturnType<typeof createSyncOrAsyncFunctionSchemaWithArgs<ArgsSchema>>;

// Overload for sync or async function schema with only output
export function syncOrAsyncFunctionSchema<
  const OutputSchema extends v.GenericSchema,
>(options: {
  args?: undefined;
  output: OutputSchema;
}): ReturnType<typeof createSyncOrAsyncFunctionSchemaWithOutput<OutputSchema>>;

// Overload for sync or async function schema with no arguments and no output
export function syncOrAsyncFunctionSchema(options?: {
  args?: undefined;
  output?: undefined;
}): ReturnType<typeof createSyncOrAsyncFunctionSchema>;

/**
 * A schema for a function that can be either synchronous or asynchronous with optional argument and output schemas.
 * @param options An object describing the arguments and output of the function schema to create.
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
    );
  }

  if (options.args) {
    return createSyncOrAsyncFunctionSchemaWithArgs(options.args);
  }

  if (options.output) {
    return createSyncOrAsyncFunctionSchemaWithOutput(options.output);
  }

  return createSyncOrAsyncFunctionSchema();
}

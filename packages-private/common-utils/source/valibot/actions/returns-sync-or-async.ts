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

/**
 * Checks if a value is Promise-like by verifying if it's an object or function with a 'then' method.
 * @param value The value to check.
 */
function isPromiseLike<TValue>(value: unknown): value is PromiseLike<TValue> {
  if (typeof value !== "object" && typeof value !== "function") {
    return false;
  }

  if (value === null) {
    return false;
  }

  return "then" in value && typeof value.then === "function";
}

/** Represents an action that validates the return value of a function, supporting both synchronous and asynchronous outputs. */
export interface ReturnsSyncOrAsyncAction<
  TArgs extends unknown[],
  TOutput,
  TSchema extends v.GenericSchema,
> extends v.BaseTransformation<
    (...args: TArgs) => TOutput,
    (
      ...args: TArgs
    ) => v.InferOutput<TSchema> | PromiseLike<v.InferOutput<TSchema>>,
    never
  > {
  readonly reference: typeof returnsSyncOrAsync;
  readonly schema: TSchema;
  readonly type: "returns";
}

/**
 * Prototypes a return action that validates either a direct return value or a resolved PromiseLike value.
 * @param schema The Valibot schema to validate the function's return value against.
 */
export function returnsSyncOrAsync<
  TArgs extends unknown[],
  TOutput,
  const TSchema extends v.GenericSchema,
>(schema: TSchema): ReturnsSyncOrAsyncAction<TArgs, TOutput, TSchema> {
  return {
    kind: "transformation",
    type: "returns",
    async: false,

    reference: returnsSyncOrAsync,
    schema,

    "~run"(dataset) {
      const func = dataset.value as (...args: TArgs) => TOutput;
      const wrappedFunction = (...args: TArgs) => {
        const output = func(...args);

        if (isPromiseLike(output)) {
          return output.then((resolvedOutput) =>
            v.parse(schema, resolvedOutput),
          );
        }

        return v.parse(schema, output);
      };

      return {
        ...dataset,
        value: wrappedFunction,
      } as v.OutputDataset<
        (
          ...args: TArgs
        ) => v.InferOutput<TSchema> | PromiseLike<v.InferOutput<TSchema>>,
        v.BaseIssue<unknown>
      >;
    },
  };
}

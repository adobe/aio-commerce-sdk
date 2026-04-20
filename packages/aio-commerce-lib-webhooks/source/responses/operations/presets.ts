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

import type {
  AddOperation,
  ExceptionOperation,
  RemoveOperation,
  ReplaceOperation,
  SuccessOperation,
} from "./types";

/**
 * Creates a success operation response
 * The process that triggered the original event continues without any changes.
 *
 * @example
 * ```typescript
 * return successOperation();
 * ```
 */
export const successOperation = (): SuccessOperation => ({ op: "success" });

/**
 * Creates an exception operation response with a message
 * Causes Commerce to terminate the process that triggered the original event.
 *
 * @param message - Exception message
 * @param exceptionClass - Optional exception class name
 *
 * @example
 * ```typescript
 * return exceptionOperation("The product cannot be added to the cart because it is out of stock");
 *
 * return exceptionOperation(
 *   "Custom error occurred",
 *   "Path\\To\\Exception\\Class"
 * );
 * ```
 */
export const exceptionOperation = (
  message: string,
  exceptionClass?: string,
): ExceptionOperation => ({
  op: "exception",
  ...(message && { message }),
  ...(exceptionClass && { class: exceptionClass }),
});

/**
 * Creates an add operation response
 * Causes Commerce to add the provided value to the provided path in the triggered event arguments.
 *
 * @template TValue - The type of the value to be added
 * @param path - Path at which the value should be added
 * @param value - Value to be added
 * @param instance - Optional DataObject class name
 *
 * @example
 * ```typescript
 * return addOperation(
 *   "result",
 *   { data: { amount: "5", carrier_code: "newshipmethod" } },
 *   "Magento\\Quote\\Api\\Data\\ShippingMethodInterface"
 * );
 * ```
 */
export const addOperation = <TValue = unknown>(
  path: string,
  value: TValue,
  instance?: string,
): AddOperation<TValue> => ({
  op: "add",
  path,
  value,
  ...(instance && { instance }),
});

/**
 * Creates a replace operation response
 * Causes Commerce to replace a value in triggered event arguments for the provided path.
 *
 * @template TValue - The type of the replacement value
 * @param path - Path at which the value should be replaced
 * @param value - Replacement value
 * @param instance - Optional DataObject class name
 *
 * @example
 * ```typescript
 * return replaceOperation("result/shipping_methods/shipping_method_one/amount", 6);
 * ```
 */
export const replaceOperation = <TValue = unknown>(
  path: string,
  value: TValue,
  instance?: string,
): ReplaceOperation<TValue> => ({
  op: "replace",
  path,
  value,
  ...(instance && { instance }),
});

/**
 * Creates a remove operation response
 * Causes Commerce to remove a value or node in triggered event arguments by the provided path.
 *
 * @param path - Path at which the value should be removed
 *
 * @example
 * ```typescript
 * return removeOperation("result/key2");
 * ```
 */
export const removeOperation = (path: string): RemoveOperation => ({
  op: "remove",
  path,
});

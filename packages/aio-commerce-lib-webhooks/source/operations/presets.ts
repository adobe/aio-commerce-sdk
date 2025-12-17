/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  buildAddOperation,
  buildExceptionOperation,
  buildRemoveOperation,
  buildReplaceOperation,
  buildSuccessOperation,
} from "./helpers";

import type {
  AddOperation,
  ExceptionOperation,
  RemoveOperation,
  ReplaceOperation,
  SuccessOperation,
} from "./helpers";

/**
 * Creates a success operation response
 * The process that triggered the original event continues without any changes.
 * See {@link buildSuccessOperation} for details.
 *
 * @example
 * ```typescript
 * return successOperation();
 * ```
 */
export const successOperation = (): SuccessOperation => buildSuccessOperation();

/**
 * Creates an exception operation response with a message
 * Causes Commerce to terminate the process that triggered the original event.
 * See {@link buildExceptionOperation} for details.
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
): ExceptionOperation =>
  buildExceptionOperation({
    message,
    ...(exceptionClass && { class: exceptionClass }),
  });

/**
 * Creates an add operation response
 * Causes Commerce to add the provided value to the provided path in the triggered event arguments.
 * See {@link buildAddOperation} for details.
 *
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
export const addOperation = (
  path: string,
  value: unknown,
  instance?: string,
): AddOperation => buildAddOperation(path, value, instance);

/**
 * Creates a replace operation response
 * Causes Commerce to replace a value in triggered event arguments for the provided path.
 * See {@link buildReplaceOperation} for details.
 *
 * @param path - Path at which the value should be replaced
 * @param value - Replacement value
 * @param instance - Optional DataObject class name
 *
 * @example
 * ```typescript
 * return replaceOperation("result/shipping_methods/shipping_method_one/amount", 6);
 * ```
 */
export const replaceOperation = (
  path: string,
  value: unknown,
  instance?: string,
): ReplaceOperation => buildReplaceOperation(path, value, instance);

/**
 * Creates a remove operation response
 * Causes Commerce to remove a value or node in triggered event arguments by the provided path.
 * See {@link buildRemoveOperation} for details.
 *
 * @param path - Path at which the value should be removed
 *
 * @example
 * ```typescript
 * return removeOperation("result/key2");
 * ```
 */
export const removeOperation = (path: string): RemoveOperation =>
  buildRemoveOperation(path);

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

/**
 * Webhook operation types supported by Adobe Commerce
 * @see https://developer.adobe.com/commerce/extensibility/webhooks/responses/
 */
export type WebhookOperation =
  | "success"
  | "exception"
  | "add"
  | "replace"
  | "remove";

/**
 * Base webhook response structure
 */
export type WebhookResponseBase = {
  op: WebhookOperation;
};

/**
 * Success operation response
 * The process that triggered the original event continues without any changes.
 */
export type SuccessOperation = {
  op: "success";
};

/**
 * Exception operation response
 * Causes Commerce to terminate the process that triggered the original event.
 */
export type ExceptionOperation = {
  op: "exception";
  /** Specifies the exception class. If not set, \Magento\Framework\Exception\LocalizedException will be thrown. */
  class?: string;
  /** Specifies the exception message. If not set, fallbackErrorMessage or system default will be used. */
  message?: string;
};

/**
 * Add operation response
 * Causes Commerce to add the provided value to the provided path in the triggered event arguments.
 */
export type AddOperation = {
  op: "add";
  /** Specifies the path at which the value should be added to the triggered event arguments. */
  path: string;
  /** Specifies the value to be added. This can be a single value or in an array format. */
  value: unknown;
  /** Specifies the DataObject class name to create, based on the value and added to the provided path. */
  instance?: string;
};

/**
 * Replace operation response
 * Causes Commerce to replace a value in triggered event arguments for the provided path.
 */
export type ReplaceOperation = {
  op: "replace";
  /** Specifies the path at which the value should be replaced with the provided value. */
  path: string;
  /** Specifies the replacement value. This can be a single value or in an array format. */
  value: unknown;
  /** Specifies the DataObject class name to create, based on the value and added to the provided path. */
  instance?: string;
};

/**
 * Remove operation response
 * Causes Commerce to remove a value or node in triggered event arguments by the provided path.
 */
export type RemoveOperation = {
  op: "remove";
  /** Specifies the path at which the value should be removed. */
  path: string;
};

/**
 * Union type representing any webhook operation response
 */
export type WebhookOperationResponse =
  | SuccessOperation
  | ExceptionOperation
  | AddOperation
  | ReplaceOperation
  | RemoveOperation;

/**
 * Webhook response can be a single operation or an array of operations
 */
export type WebhookResponse =
  | WebhookOperationResponse
  | WebhookOperationResponse[];

/**
 * Creates a success operation response
 * The process that triggered the original event continues without any changes.
 *
 * @returns Success operation response
 *
 * @example
 * ```typescript
 * const response = buildSuccessOperation();
 * // Returns: { op: "success" }
 * ```
 */
export function buildSuccessOperation(): SuccessOperation {
  return { op: "success" };
}

/**
 * Creates an exception operation response
 * Causes Commerce to terminate the process that triggered the original event.
 *
 * @param payload - Exception configuration
 * @param payload.message - Exception message
 * @param payload.class - Optional exception class name
 *
 * @returns Exception operation response
 *
 * @example
 * ```typescript
 * const response = buildExceptionOperation({
 *   message: "The product cannot be added to the cart because it is out of stock"
 * });
 *
 * const customException = buildExceptionOperation({
 *   message: "Custom error occurred",
 *   class: "Path\\To\\Exception\\Class"
 * });
 * ```
 */
export function buildExceptionOperation(payload?: {
  message?: string;
  class?: string;
}): ExceptionOperation {
  return {
    op: "exception",
    ...(payload?.message && { message: payload.message }),
    ...(payload?.class && { class: payload.class }),
  };
}

/**
 * Creates an add operation response
 * Causes Commerce to add the provided value to the provided path in the triggered event arguments.
 *
 * @param path - Path at which the value should be added
 * @param value - Value to be added
 * @param instance - Optional DataObject class name
 *
 * @returns Add operation response
 *
 * @example
 * ```typescript
 * const response = buildAddOperation(
 *   "result",
 *   { data: { amount: "5", carrier_code: "newshipmethod" } },
 *   "Magento\\Quote\\Api\\Data\\ShippingMethodInterface"
 * );
 * ```
 */
export function buildAddOperation(
  path: string,
  value: unknown,
  instance?: string,
): AddOperation {
  return {
    op: "add",
    path,
    value,
    ...(instance && { instance }),
  };
}

/**
 * Creates a replace operation response
 * Causes Commerce to replace a value in triggered event arguments for the provided path.
 *
 * @param path - Path at which the value should be replaced
 * @param value - Replacement value
 * @param instance - Optional DataObject class name
 *
 * @returns Replace operation response
 *
 * @example
 * ```typescript
 * const response = buildReplaceOperation(
 *   "result/shipping_methods/shipping_method_one/amount",
 *   6
 * );
 * ```
 */
export function buildReplaceOperation(
  path: string,
  value: unknown,
  instance?: string,
): ReplaceOperation {
  return {
    op: "replace",
    path,
    value,
    ...(instance && { instance }),
  };
}

/**
 * Creates a remove operation response
 * Causes Commerce to remove a value or node in triggered event arguments by the provided path.
 *
 * @param path - Path at which the value should be removed
 *
 * @returns Remove operation response
 *
 * @example
 * ```typescript
 * const response = buildRemoveOperation("result/key2");
 * // Removes the key2 element from the result
 * ```
 */
export function buildRemoveOperation(path: string): RemoveOperation {
  return {
    op: "remove",
    path,
  };
}

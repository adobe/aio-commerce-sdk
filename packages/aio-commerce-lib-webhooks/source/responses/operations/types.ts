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
 * @template TValue - The type of the value to be added (defaults to unknown)
 */
export type AddOperation<TValue = unknown> = {
  op: "add";
  /** Specifies the path at which the value should be added to the triggered event arguments. */
  path: string;
  /** Specifies the value to be added. This can be a single value or in an array format. */
  value: TValue;
  /** Specifies the DataObject class name to create, based on the value and added to the provided path. */
  instance?: string;
};

/**
 * Replace operation response
 * Causes Commerce to replace a value in triggered event arguments for the provided path.
 * @template TValue - The type of the replacement value (defaults to unknown)
 */
export type ReplaceOperation<TValue = unknown> = {
  op: "replace";
  /** Specifies the path at which the value should be replaced with the provided value. */
  path: string;
  /** Specifies the replacement value. This can be a single value or in an array format. */
  value: TValue;
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
  | AddOperation<unknown>
  | ReplaceOperation<unknown>
  | RemoveOperation;

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

export type HeadersRecord = Record<string, string>;
export type BodyRecord = Record<string, unknown>;
export type BodyRecordWithMessage = BodyRecord & { message: string };

/**
 * Common payload structure for runtime action responses
 * @template TBody - Response body properties
 * @template THeaders - Custom response headers
 */
export type ResponsePayload<
  TBody extends BodyRecord = BodyRecord,
  THeaders extends HeadersRecord = HeadersRecord,
> = {
  statusCode: number;
  body?: TBody;
  headers?: THeaders;
};

/**
 * Represents an error response from a runtime action
 * @template TBody - Additional error body properties beyond the required message field
 * @template THeaders - Custom response headers
 */
export type ErrorResponse<
  TBody extends BodyRecordWithMessage = BodyRecordWithMessage,
  THeaders extends HeadersRecord = HeadersRecord,
> = {
  type: "error";
  error: ResponsePayload<TBody, THeaders>;
};

/**
 * Represents a successful response from a runtime action
 * @template TBody - Response body properties
 * @template THeaders - Custom response headers
 */
export type SuccessResponse<
  TBody extends BodyRecord = BodyRecord,
  THeaders extends HeadersRecord = HeadersRecord,
> = ResponsePayload<TBody, THeaders> & {
  type: "success";
};

/**
 * Union type representing either a successful or error response from a runtime action
 * @template TBody - Response/error body properties
 * @template THeaders - Custom response headers
 */
export type ActionResponse<
  TSuccessBody extends BodyRecord = BodyRecord,
  TErrorBody extends BodyRecordWithMessage = BodyRecordWithMessage,
  THeaders extends HeadersRecord = HeadersRecord,
> =
  | SuccessResponse<TSuccessBody, THeaders>
  | ErrorResponse<TErrorBody, THeaders>;

/**
 * Creates a standardized error response for runtime actions
 * @see https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions#unsuccessful-response
 *
 * @template TBody - Additional error body properties beyond the required message field
 * @template THeaders - Custom response headers
 *
 * @param statusCode - HTTP status code (e.g., 400, 404, 500)
 * @param payload - Error response configuration
 * @param payload.message - Human-readable error message (required)
 * @param payload.body - Optional additional error details to include in the response body
 * @param payload.headers - Optional custom response headers
 *
 * @returns Standardized error response object with type discriminator
 *
 * @example
 * ```typescript
 * // Simple error with just a message
 * const error = buildErrorResponse(404, {
 *   message: 'Resource not found'
 * });
 *
 * // Error with additional body data
 * const error = buildErrorResponse(400, {
 *   message: 'Invalid request',
 *   body: { field: 'email', code: 'INVALID_FORMAT' }
 * });
 *
 * // Error with custom headers
 * const error = buildErrorResponse(429, {
 *   message: 'Rate limit exceeded',
 *   headers: { 'Retry-After': '60' }
 * });
 * ```
 */
export function buildErrorResponse<
  TBody extends BodyRecordWithMessage = BodyRecordWithMessage,
  THeaders extends HeadersRecord = HeadersRecord,
>(
  statusCode: number,
  payload: { body: TBody; headers?: THeaders },
): ErrorResponse<TBody, THeaders> {
  return {
    type: "error",
    error: {
      ...(payload?.headers && { headers: payload.headers }),

      statusCode,
      body: payload.body,
    },
  };
}

/**
 * Creates a standardized success response for runtime actions
 * @see https://developer.adobe.com/app-builder/docs/guides/runtime_guides/creating-actions#successful-response
 *
 * @template TBody - Response body properties
 * @template THeaders - Custom response headers
 *
 * @param statusCode - HTTP status code (typically 200, 201, 204, etc.)
 * @param payload - Success response configuration
 * @param payload.message - Human-readable success message (required)
 * @param payload.body - Optional additional response data to include in the response body
 * @param payload.headers - Optional custom response headers
 *
 * @returns Standardized success response object with type discriminator
 *
 * @example
 * ```typescript
 * // Simple success response
 * const response = buildSuccessResponse(200, {
 *   message: 'Operation successful'
 * });
 *
 * // Success with additional body data
 * const response = buildSuccessResponse(201, {
 *   message: 'Resource created',
 *   body: { id: '456', created: true },
 *   headers: { 'Location': '/api/resources/456' }
 * });
 * ```
 */
export function buildSuccessResponse<
  TBody extends BodyRecord = BodyRecord,
  THeaders extends HeadersRecord = HeadersRecord,
>(
  statusCode: number,
  payload?: { body?: TBody; headers?: THeaders },
): SuccessResponse<TBody, THeaders> {
  return {
    type: "success",
    statusCode,

    ...(payload?.headers && { headers: payload.headers }),
    ...(payload?.body && { body: payload.body }),
  };
}

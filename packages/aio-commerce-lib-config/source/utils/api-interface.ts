/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

export interface ActionErrorResponse {
  code: string;
  message: string;
  details?: string;
}

export interface StandardActionResponse<T = unknown> {
  statusCode: number;
  body: T | { error: ActionErrorResponse };
  headers?: Record<string, string>;
}

/**
 * Creates a standardized error response for runtime actions
 * @param statusCode - HTTP status code
 * @param code - Error code identifier
 * @param message - Human-readable error message
 * @param details - Optional additional details about the error
 * @returns Standardized action error response
 */
export function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: string,
): StandardActionResponse {
  return {
    statusCode,
    body: {
      error: {
        code,
        message,
        details,
      },
    },
  };
}

/**
 * Creates a standardized success response for runtime actions
 * @param statusCode - HTTP status code (typically 200)
 * @param data - Response data
 * @param headers - Optional response headers
 * @returns Standardized action success response
 */
export function createSuccessResponse<T>(
  statusCode: number,
  data: T,
  headers?: Record<string, string>,
): StandardActionResponse<T> {
  return {
    statusCode,
    body: data,
    ...(headers && { headers }),
  };
}

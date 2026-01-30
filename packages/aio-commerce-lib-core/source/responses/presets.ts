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

import { buildErrorResponse, buildSuccessResponse } from "./helpers";

import type {
  BodyRecord,
  BodyRecordWithMessage,
  HeadersRecord,
} from "./helpers";

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_ACCEPTED = 202;
export const HTTP_NON_AUTHORITATIVE_INFORMATION = 203;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_METHOD_NOT_ALLOWED = 405;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

function curryBuildSuccessResponse(code: number) {
  return (payload?: string | { body?: BodyRecord; headers?: HeadersRecord }) =>
    buildSuccessResponse(
      code,
      typeof payload === "string" ? { body: { message: payload } } : payload,
    );
}

function curryBuildErrorResponse(code: number) {
  return (
    payload: string | { body: BodyRecordWithMessage; headers?: HeadersRecord },
  ) =>
    buildErrorResponse(
      code,
      typeof payload === "string" ? { body: { message: payload } } : payload,
    );
}

/**
 * Creates a success response with the HTTP status code 200.
 * See {@link buildSuccessResponse} for details on the response payload.
 */
export const ok = curryBuildSuccessResponse(HTTP_OK);

/**
 * Creates a success response with the HTTP status code 201.
 * See {@link buildSuccessResponse} for details on the response payload.
 */
export const created = curryBuildSuccessResponse(HTTP_CREATED);

/**
 * Creates a success response with the HTTP status code 202.
 * See {@link buildSuccessResponse} for details on the response payload.
 */
export const accepted = curryBuildSuccessResponse(HTTP_ACCEPTED);

/**
 * Creates a success response with the HTTP status code 203.
 * See {@link buildSuccessResponse} for details on the response payload.
 */
export const nonAuthoritativeInformation = curryBuildSuccessResponse(
  HTTP_NON_AUTHORITATIVE_INFORMATION,
);

/**
 * Creates an error response with the HTTP status code 400.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const badRequest = curryBuildErrorResponse(HTTP_BAD_REQUEST);

/**
 * Creates an error response with the HTTP status code 401.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const unauthorized = curryBuildErrorResponse(HTTP_UNAUTHORIZED);

/**
 * Creates an error response with the HTTP status code 403.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const forbidden = curryBuildErrorResponse(HTTP_FORBIDDEN);

/**
 * Creates an error response with the HTTP status code 404.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const notFound = curryBuildErrorResponse(HTTP_NOT_FOUND);

/**
 * Creates an error response with the HTTP status code 405.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const methodNotAllowed = curryBuildErrorResponse(
  HTTP_METHOD_NOT_ALLOWED,
);

/**
 * Creates an error response with the HTTP status code 500.
 * See {@link buildErrorResponse} for details on the response payload.
 */
export const internalServerError = curryBuildErrorResponse(
  HTTP_INTERNAL_SERVER_ERROR,
);

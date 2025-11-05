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

import { createErrorResponse, createSuccessResponse } from "./helpers";

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

/**
 * Creates a success response with the HTTP status code 200.
 * See {@link createSuccessResponse} for details on the response payload.
 */
export const ok = createSuccessResponse.bind(null, HTTP_OK);

/**
 * Creates a success response with the HTTP status code 201.
 * See {@link createSuccessResponse} for details on the response payload.
 */
export const created = createSuccessResponse.bind(null, HTTP_CREATED);

/**
 * Creates an error response with the HTTP status code 400.
 * See {@link createErrorResponse} for details on the response payload.
 */
export const badRequest = createErrorResponse.bind(null, HTTP_BAD_REQUEST);

/**
 * Creates an error response with the HTTP status code 401.
 * See {@link createErrorResponse} for details on the response payload.
 */
export const unauthorized = createErrorResponse.bind(null, HTTP_UNAUTHORIZED);

/**
 * Creates an error response with the HTTP status code 403.
 * See {@link createErrorResponse} for details on the response payload.
 */
export const forbidden = createErrorResponse.bind(null, HTTP_FORBIDDEN);

/**
 * Creates an error response with the HTTP status code 404.
 * See {@link createErrorResponse} for details on the response payload.
 */
export const notFound = createErrorResponse.bind(null, HTTP_NOT_FOUND);

/**
 * Creates an error response with the HTTP status code 500.
 * See {@link createErrorResponse} for details on the response payload.
 */
export const internalServerError = createErrorResponse.bind(
  null,
  HTTP_INTERNAL_SERVER_ERROR,
);

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParseAsync } from "valibot";

import type { InferInput, InferOutput } from "valibot";
import type {
  AioOpenApiErrorResponse,
  MaybeAsyncGenericSchema,
  OpenApiResponse,
} from "~/common";
import type {
  ErrorStatusCode,
  ErrorStatusCodeString,
  HttpMethod,
} from "~/http";

/**
 * Helper type to conditionally infer schema types (input or output)
 * Returns undefined if the schema is not a valid MaybeAsyncGenericSchema
 */
type InferSchema<
  TSchema,
  TMode extends "input" | "output",
> = TSchema extends MaybeAsyncGenericSchema
  ? TMode extends "input"
    ? InferInput<TSchema>
    : InferOutput<TSchema>
  : undefined;

/**
 * Route configuration for error response handlers
 */
export type ErrorRoute<TResponse extends OpenApiResponse> = {
  method: HttpMethod;
  path: string;
  response: TResponse;
  status: ErrorStatusCode & ErrorStatusCodeString;
};

/**
 * Infer types for error response body
 */
export type ErrorBodyInput<TResponse extends OpenApiResponse> = InferInput<
  TResponse["schema"]
>;

export type ErrorBodyOutput<TResponse extends OpenApiResponse> = InferOutput<
  TResponse["schema"]
>;

/**
 * Infer types for error response headers using the helper
 */
export type ErrorHeaderInput<TResponse extends OpenApiResponse> = InferSchema<
  TResponse["headers"],
  "input"
>;

export type ErrorHeaderOutput<TResponse extends OpenApiResponse> = InferSchema<
  TResponse["headers"],
  "output"
>;

function hasHeaders<T extends MaybeAsyncGenericSchema | undefined>(
  headers: T,
): headers is Exclude<T, undefined> {
  return headers !== undefined;
}

export async function error<
  TResponse extends OpenApiResponse,
  Route extends ErrorRoute<TResponse>,
>(
  route: Route,
  data: ErrorBodyInput<TResponse>,
  headers?: ErrorHeaderInput<TResponse>,
) {
  const { method, path, response: spec, status } = route;

  const bodyValidatorResult = await safeParseAsync<TResponse["schema"]>(
    spec.schema,
    data,
  );
  if (!bodyValidatorResult.success) {
    throw new CommerceSdkValidationError(
      `Invalid error response for route [${method}] ${path} with status ${String(status)}`,
      {
        issues: bodyValidatorResult.issues,
      },
    );
  }

  const errorResponse: AioOpenApiErrorResponse<
    ErrorBodyOutput<TResponse>,
    undefined
  > = {
    error: {
      statusCode: Number(status),
      body: bodyValidatorResult.output satisfies ErrorBodyOutput<TResponse>,
    },
  };

  if (hasHeaders<TResponse["headers"]>(spec.headers)) {
    const headersValidationResult = await safeParseAsync(spec.headers, headers);

    if (!headersValidationResult.success) {
      throw new CommerceSdkValidationError(
        `Invalid error headers for route ${path} with status ${String(status)}`,
        {
          issues: headersValidationResult.issues,
        },
      );
    }

    return {
      ...errorResponse,
      error: {
        ...errorResponse.error,
        headers: headersValidationResult.output,
      },
    };
  }

  return errorResponse;
}

export const createErrorRoute = <TResponse extends OpenApiResponse>(
  method: HttpMethod,
  path: string,
  status: ErrorStatusCodeString & ErrorStatusCode,
  responseSpec: TResponse,
): ErrorRoute<TResponse> => {
  return {
    method,
    path,
    response: responseSpec,
    status,
  };
};

export const createErrorHandler =
  <TResponse extends OpenApiResponse, Route extends ErrorRoute<TResponse>>(
    route: Route,
  ) =>
  (
    data: ErrorBodyInput<Route["response"]>,
    headers?: ErrorHeaderInput<Route["response"]>,
  ) => {
    const { method, path, status, response: responseSpec } = route;
    return error(
      {
        method,
        path,
        status,
        response: responseSpec,
      },
      data,
      headers,
    );
  };

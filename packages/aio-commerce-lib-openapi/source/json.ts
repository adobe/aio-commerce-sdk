import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParseAsync } from "valibot";

import type { InferInput, InferOutput } from "valibot";
import type { MaybeAsyncGenericSchema, OpenApiResponse } from "~/common";
import type {
  HttpMethod,
  SuccessStatusCode,
  SuccessStatusCodeString,
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
 * Route configuration for JSON response handlers
 */
export type JsonRoute<TResponse extends OpenApiResponse> = {
  method: HttpMethod;
  path: string;
  response: TResponse;
  status: SuccessStatusCode & SuccessStatusCodeString;
};

/**
 * Infer types for response body
 */
export type ResponseBodyInput<TResponse extends OpenApiResponse> = InferInput<
  TResponse["schema"]
>;

export type ResponseBodyOutput<TResponse extends OpenApiResponse> = InferOutput<
  TResponse["schema"]
>;

/**
 * Infer types for response headers using the helper
 */
export type ResponseHeaderInput<TResponse extends OpenApiResponse> =
  InferSchema<TResponse["headers"], "input">;

export type ResponseHeaderOutput<TResponse extends OpenApiResponse> =
  InferSchema<TResponse["headers"], "output">;

/**
 * Legacy type aliases for backward compatibility
 */
export type JsonInferResponseSchemaInput<T extends OpenApiResponse> =
  ResponseBodyInput<T>;
export type JsonInferResponseSchemaOutput<T extends OpenApiResponse> =
  ResponseBodyOutput<T>;
export type JsonInferResponseHeaderInput<T extends OpenApiResponse> =
  ResponseHeaderInput<T>;
export type JsonInferResponseHeaderOutput<T extends OpenApiResponse> =
  ResponseHeaderOutput<T>;

function hasHeaders<T extends MaybeAsyncGenericSchema | undefined>(
  headers: T,
): headers is Exclude<T, undefined> {
  return headers !== undefined;
}

export async function json<
  TResponse extends OpenApiResponse,
  Route extends JsonRoute<TResponse>,
>(
  route: Route,
  data: ResponseBodyInput<TResponse>,
  headers?: ResponseHeaderInput<TResponse>,
) {
  const { method, path, response: spec, status } = route;

  const bodyValidatorResult = await safeParseAsync<TResponse["schema"]>(
    spec.schema,
    data,
  );
  if (!bodyValidatorResult.success) {
    throw new CommerceSdkValidationError(
      `Invalid response for route [${method}] ${path} with status ${String(status)}`,
      {
        issues: bodyValidatorResult.issues,
      },
    );
  }

  const response = {
    statusCode: status,
    body: bodyValidatorResult.output satisfies ResponseBodyOutput<TResponse>,
  };

  if (hasHeaders<TResponse["headers"]>(spec.headers)) {
    const headersValidationResult = await safeParseAsync(spec.headers, headers);

    if (!headersValidationResult.success) {
      throw new CommerceSdkValidationError(
        `Invalid headers for route ${path} with status ${String(status)}`,
        {
          issues: headersValidationResult.issues,
        },
      );
    }

    return {
      ...response,
      headers: headersValidationResult.output,
    };
  }

  return response;
}

export const createSubRoute = <TResponse extends OpenApiResponse>(
  method: HttpMethod,
  path: string,
  status: SuccessStatusCodeString & SuccessStatusCode,
  responseSpec: TResponse,
): JsonRoute<TResponse> => {
  return {
    method,
    path,
    response: responseSpec,
    status,
  };
};

export const createJsonHandler =
  <TResponse extends OpenApiResponse, Route extends JsonRoute<TResponse>>(
    route: Route,
  ) =>
  (
    data: ResponseBodyInput<Route["response"]>,
    headers?: ResponseHeaderInput<Route["response"]>,
  ) => {
    const { method, path, status, response: responseSpec } = route;
    return json(
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

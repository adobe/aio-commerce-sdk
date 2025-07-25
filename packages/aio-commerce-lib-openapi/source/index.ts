import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  type GenericSchema,
  type GenericSchemaAsync,
  type InferInput,
  type InferOutput,
  safeParseAsync,
  safeParserAsync,
} from "valibot";
import type {
  ClientErrorStatusCode,
  ServerErrorStatusCode,
  SuccessStatusCode,
} from "~/http";

// Constants
export const ResponseType = {
  Error: "error",
  Success: "success",
} as const;

// Type aliases (alphabetically ordered)
export type AioOpenApiErrorResponse<TBody> = AioOpenApiResponse<"Error", TBody>;

export type AioOpenApiResponse<
  TType extends keyof typeof ResponseType,
  TBody,
  THeaders = undefined,
> = TType extends "Error"
  ? {
      type: typeof ResponseType.Error;
      error: {
        statusCode: number;
        body: TBody;
      };
    }
  : {
      type: typeof ResponseType.Success;
      headers?: THeaders;
      statusCode: number;
      body: TBody;
    };

export type AioOpenApiSuccessResponse<
  TBody,
  THeaders = undefined,
> = AioOpenApiResponse<"Success", TBody, THeaders>;

type AllErrorStatusCodes = ClientErrorStatusCode | ServerErrorStatusCode;

export type ErrorResponseKeys<TResponse extends OpenApiResponses> =
  keyof TResponse & StatusCodeString<AllErrorStatusCodes>;

export type InferInputResponseHeaderByStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = TResponse[TStatus]["headers"] extends MaybeAsyncGenericSchema
  ? InferInput<TResponse[TStatus]["headers"]>
  : undefined;

type InferInputResponseSchema<TResponse extends OpenApiResponses> = InferInput<
  TResponse[keyof TResponse]["schema"]
>;

type InferInputErrorResponseSchemaWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends ErrorResponseKeys<TResponse>,
> = InferInput<TResponse[TStatus]["schema"]>;

type InferInputResponseSchemaWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends SuccessResponseKeys<TResponse>,
> = InferInput<TResponse[TStatus]["schema"]>;

type InferOutputResponseHeaderObjectWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends SuccessResponseKeys<TResponse>,
> = TResponse[TStatus]["headers"] extends MaybeAsyncGenericSchema
  ? InferOutput<TResponse[TStatus]["headers"]>
  : undefined;

type InferOutputResponseSchema<TResponse extends OpenApiResponses> =
  InferOutput<TResponse[keyof TResponse]["schema"]>;

type InferOutputResponseSchemaWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = InferOutput<TResponse[TStatus]["schema"]>;

type InputRequest = Record<PropertyKey, unknown>;

export type MaybeAsyncGenericSchema = GenericSchema | GenericSchemaAsync;

export type OpenApiRequest = {
  body?: OpenApiRequestBody;
  query?: MaybeAsyncGenericSchema;
  params?: MaybeAsyncGenericSchema;
  headers?: MaybeAsyncGenericSchema;
};

export type OpenApiRequestBody = {
  schema: MaybeAsyncGenericSchema;
};

export type OpenApiResponse = {
  headers?: MaybeAsyncGenericSchema;
  schema: MaybeAsyncGenericSchema;
};

export type OpenApiResponses = Record<PropertyKey, OpenApiResponse>;

type RequestBodyOutput<TRequest extends OpenApiRequest> =
  TRequest["body"] extends {
    schema: infer TSchema extends MaybeAsyncGenericSchema;
  }
    ? InferOutput<TSchema>
    : never;

type RequestValidatorFunction<
  TRequest extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
> = () => Promise<RequestValidatorOutput<TRequest, TField>>;

type RequestValidatorOutput<
  TRequest extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
> = TRequest[TField] extends MaybeAsyncGenericSchema
  ? InferOutput<TRequest[TField]>
  : never;

type StatusCodeString<T extends number> = T | `${T}`;

export type SuccessResponseKeys<TResponse extends OpenApiResponses> =
  keyof TResponse & StatusCodeString<SuccessStatusCode>;

// Interfaces (alphabetically ordered)
interface OpenApiSpecHandler<
  TRequestSchema extends OpenApiRequest,
  TResponse extends OpenApiResponses,
> {
  error: <TStatus extends ErrorResponseKeys<TResponse>>(
    data: InferInputErrorResponseSchemaWithStatus<TResponse, TStatus>,
    status?: TStatus,
  ) => Promise<
    AioOpenApiErrorResponse<
      InferOutputResponseSchemaWithStatus<TResponse, TStatus>
    >
  >;
  json: <TStatus extends SuccessResponseKeys<TResponse>>(
    data: InferInputResponseSchemaWithStatus<TResponse, TStatus>,
    status?: TStatus,
    headers?: InferInputResponseHeaderByStatus<TResponse, TStatus>,
  ) => Promise<
    AioOpenApiSuccessResponse<
      InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
      InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
    >
  >;
  validateBody: () => Promise<RequestBodyOutput<TRequestSchema>>;
  validateParams: RequestValidatorFunction<TRequestSchema, "params">;
  validateHeaders: RequestValidatorFunction<TRequestSchema, "headers">;
  validateQuery: RequestValidatorFunction<TRequestSchema, "query">;
}

export interface Route<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
> {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  request: TRequestSchema;
  responses: TResponseSchema;
}

export function openapi<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(
  route: Route<TRequest, TResponse>,
  handler: (
    spec: OpenApiSpecHandler<TRequest, TResponse>,
  ) => Promise<
    | Awaited<ReturnType<OpenApiSpecHandler<TRequest, TResponse>["json"]>>
    | Awaited<ReturnType<OpenApiSpecHandler<TRequest, TResponse>["error"]>>
  >,
) {
  const routeHandler = createRoute(route);

  return (params: InputRequest) => handler(routeHandler(params));
}

async function validateRequestInput<
  TRequestSchema extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
>(
  schema: TRequestSchema[TField],
  params: InputRequest,
  path: string,
  schemaType: TField,
): Promise<RequestValidatorOutput<TRequestSchema, TField>> {
  if (!schema) {
    throw new Error(`No ${schemaType} schema defined for route ${path}`);
  }

  const validationResult = await safeParseAsync(schema, params);
  if (!validationResult.success) {
    throw new CommerceSdkValidationError(
      `Invalid ${schemaType} for route ${path}`,
      {
        issues: validationResult.issues,
      },
    );
  }

  return validationResult.output as RequestValidatorOutput<
    TRequestSchema,
    TField
  >;
}

export function createRoute<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(route: Route<TRequest, TResponse>) {
  const bodySchema = route.request.body?.schema;
  const bodyParser = bodySchema ? safeParserAsync(bodySchema) : undefined;

  return (requestInputParams: InputRequest) => {
    return {
      async error<TStatus extends ErrorResponseKeys<TResponse>>(
        data: InferInputResponseSchema<TResponse>,
        status: TStatus = "500" as TStatus,
      ) {
        const responseSpec = route.responses[String(status)];
        if (!responseSpec) {
          throw new Error(
            `No response schema defined for status ${String(status)} in route ${route.path}`,
          );
        }

        // TODO: Support header validation for error responses

        const validationResult = await safeParseAsync<
          TResponse[TStatus]["schema"]
        >(responseSpec.schema, data);

        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid error response for route ${route.path} with status ${String(status)}`,
            {
              issues: validationResult.issues,
            },
          );
        }

        return {
          type: ResponseType.Error,
          error: {
            statusCode: Number(status),
            body: validationResult.output,
          },
        };
      },
      async json<TStatus extends SuccessResponseKeys<TResponse>>(
        data: InferInputResponseSchema<TResponse>,
        status: TStatus = "200" as TStatus,
        headers?: InferInputResponseHeaderByStatus<TResponse, TStatus>,
      ) {
        const responseSpec = route.responses[String(status)];

        if (!responseSpec) {
          throw new Error(
            `No response schema defined for status ${String(status)} in route ${route.path}`,
          );
        }

        const bodyValidatorResult = await safeParseAsync<
          TResponse[TStatus]["schema"]
        >(responseSpec.schema, data);

        if (!bodyValidatorResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid response for route ${route.path} with status ${String(status)}`,
            {
              issues: bodyValidatorResult.issues,
            },
          );
        }

        const response = {
          type: ResponseType.Success,
          statusCode: Number(status),
          body: bodyValidatorResult.output satisfies InferOutputResponseSchema<TResponse>,
        };

        if (responseSpec.headers) {
          const headersValidationResult = await safeParseAsync(
            responseSpec.headers,
            headers,
          );
          if (!headersValidationResult.success) {
            throw new CommerceSdkValidationError(
              `Invalid headers for route ${route.path} with status ${String(status)}`,
              {
                issues: headersValidationResult.issues,
              },
            );
          }

          return {
            ...response,
            headers:
              headersValidationResult.output as InferOutputResponseHeaderObjectWithStatus<
                TResponse,
                TStatus
              >,
          } satisfies AioOpenApiSuccessResponse<
            InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
            InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
          >;
        }

        return response satisfies AioOpenApiSuccessResponse<
          InferOutputResponseSchemaWithStatus<TResponse, TStatus>
        >;
      },
      async validateBody() {
        // TODO: This should be inferred
        if (!bodyParser) {
          throw new Error(`No body schema defined for route ${route.path}`);
        }
        const validationResult = await bodyParser(requestInputParams);
        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid request body for route ${route.path}`,
            {
              issues: validationResult.issues,
            },
          );
        }

        return validationResult.output as RequestBodyOutput<TRequest>;
      },
      validateHeaders: () =>
        validateRequestInput(
          route.request.headers,
          requestInputParams,
          route.path,
          "headers",
        ),
      validateParams: () =>
        validateRequestInput(
          route.request.params,
          requestInputParams,
          route.path,
          "params",
        ),
      validateQuery: () =>
        validateRequestInput(
          route.request.query,
          requestInputParams,
          route.path,
          "query",
        ),
    } satisfies OpenApiSpecHandler<TRequest, TResponse>;
  };
}

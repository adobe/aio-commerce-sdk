import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  type GenericSchema,
  type GenericSchemaAsync,
  type InferOutput,
  safeParserAsync,
} from "valibot";

type InputRequest = Record<PropertyKey, unknown>;
type MaybeAsyncGenericSchema = GenericSchema | GenericSchemaAsync;
type OpenApiRequestBody = {
  schema: MaybeAsyncGenericSchema;
};

type OpenApiRequest = {
  body?: OpenApiRequestBody;
  query?: MaybeAsyncGenericSchema;
  params?: MaybeAsyncGenericSchema;
  headers?: MaybeAsyncGenericSchema;
};

type OpenApiResponse = MaybeAsyncGenericSchema;
type OpenApiResponses = Record<PropertyKey, OpenApiResponse>;

export interface Route<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
> {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  request: TRequestSchema;
  responses: TResponseSchema;
}

type OpenApiHandler<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
> = <TParams extends InputRequest>(
  params: TParams,
) => OpenApiSpecHandler<TRequestSchema, TResponseSchema>;

type AioOpenApiErrorResponse<
  TBody extends InferOutput<MaybeAsyncGenericSchema>,
> = {
  error: {
    statusCode: number;
    body: TBody;
  };
};

type AioOpenApiSuccessResponse<
  TBody extends InferOutput<MaybeAsyncGenericSchema>,
> = {
  statusCode: number;
  body: TBody;
};

interface OpenApiSpecHandler<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
> {
  error: <TStatus extends keyof TResponseSchema>(
    data: InferOutput<TResponseSchema[TStatus]>,
    status?: TStatus,
  ) => Promise<AioOpenApiErrorResponse<InferOutput<TResponseSchema[TStatus]>>>;
  json: <TStatus extends keyof TResponseSchema>(
    data: InferOutput<TResponseSchema[TStatus]>,
    status?: TStatus,
  ) => Promise<
    AioOpenApiSuccessResponse<InferOutput<TResponseSchema[TStatus]>>
  >;
  validateBody: () => Promise<
    TRequestSchema["body"] extends { schema: MaybeAsyncGenericSchema }
      ? InferOutput<TRequestSchema["body"]["schema"]>
      : never
  >;
  validateParams: () => Promise<
    TRequestSchema["params"] extends MaybeAsyncGenericSchema
      ? InferOutput<TRequestSchema["params"]>
      : never
  >;
}

type ApiHandler<TResponse extends OpenApiResponses> = (
  params: InputRequest,
) => Promise<
  | AioOpenApiSuccessResponse<InferOutput<TResponse[keyof TResponse]>>
  | AioOpenApiErrorResponse<InferOutput<TResponse[keyof TResponse]>>
>;

export function openapi<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(
  route: Route<TRequest, TResponse>,
  handler: (
    spec: OpenApiSpecHandler<TRequest, TResponse>,
  ) => Promise<
    | AioOpenApiSuccessResponse<InferOutput<TResponse[keyof TResponse]>>
    | AioOpenApiErrorResponse<InferOutput<TResponse[keyof TResponse]>>
  >,
): ApiHandler<TResponse> {
  const routeHandler = createRoute(route);

  return async (params: InputRequest) => {
    const spec = await routeHandler(params);
    return handler(spec);
  };
}

export function createRoute<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(route: Route<TRequest, TResponse>): OpenApiHandler<TRequest, TResponse> {
  const bodySchema = route.request.body?.schema;
  const bodyParser = bodySchema ? safeParserAsync(bodySchema) : undefined;
  const paramsSchema = route.request.params;
  const paramsParser = paramsSchema ? safeParserAsync(paramsSchema) : undefined;

  const responseValidators: Record<
    string,
    ReturnType<typeof safeParserAsync>
  > = {};
  for (const [statusCode, schema] of Object.entries(route.responses)) {
    responseValidators[statusCode] = safeParserAsync(schema);
  }

  return (params: InputRequest) => {
    return {
      async error<TStatus extends keyof TResponse>(
        data: InferOutput<TResponse[TStatus]>,
        status: TStatus = "500" as TStatus,
      ) {
        const validator = responseValidators[String(status)];
        if (!validator) {
          throw new Error(
            `No response schema defined for status ${String(status)}`,
          );
        }

        const validationResult = await validator(data);
        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid error response for route ${route.path} with status ${String(status)}`,
            {
              issues: validationResult.issues,
            },
          );
        }

        return {
          error: {
            statusCode: Number(status),
            body: validationResult.output satisfies InferOutput<
              TResponse[TStatus]
            >,
          },
        } satisfies AioOpenApiErrorResponse<InferOutput<TResponse[TStatus]>>;
      },
      async json<TStatus extends keyof TResponse>(
        data: InferOutput<TResponse[TStatus]>,
        status: TStatus = "200" as TStatus,
      ) {
        const validator = responseValidators[String(status)];
        if (!validator) {
          throw new Error(
            `No response schema defined for status ${String(status)}`,
          );
        }

        const validationResult = await validator(data);
        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid response for route ${route.path} with status ${String(status)}`,
            {
              issues: validationResult.issues,
            },
          );
        }

        return {
          statusCode: Number(status),
          body: validationResult.output satisfies InferOutput<
            TResponse[TStatus]
          >,
        } satisfies AioOpenApiSuccessResponse<InferOutput<TResponse[TStatus]>>;
      },
      async validateParams() {
        if (!paramsParser) {
          throw new Error(`No params schema defined for route ${route.path}`);
        }

        const validationResult = await paramsParser(params);
        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid parameters for route ${route.path}`,
            {
              issues: validationResult.issues,
            },
          );
        }
        return validationResult.output as TRequest["params"] extends MaybeAsyncGenericSchema
          ? InferOutput<TRequest["params"]>
          : never;
      },
      async validateBody() {
        if (!bodyParser) {
          throw new Error(`No body schema defined for route ${route.path}`);
        }
        const validationResult = await bodyParser(params);
        if (!validationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid request body for route ${route.path}`,
            {
              issues: validationResult.issues,
            },
          );
        }

        return validationResult.output as TRequest["body"] extends {
          schema: MaybeAsyncGenericSchema;
        }
          ? InferOutput<TRequest["body"]["schema"]>
          : never;
      },
    } satisfies OpenApiSpecHandler<TRequest, TResponse>;
  };
}

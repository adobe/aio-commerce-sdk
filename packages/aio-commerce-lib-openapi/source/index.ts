import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  type GenericSchema,
  type GenericSchemaAsync,
  type InferInput,
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

type OpenApiResponse = {
  headers?: MaybeAsyncGenericSchema;
  schema: MaybeAsyncGenericSchema;
};
type OpenApiResponses = Record<PropertyKey, OpenApiResponse>;

// Helper function to create a response schema from a valibot schema
export function createResponseSchema(
  schema: MaybeAsyncGenericSchema,
  headers?: MaybeAsyncGenericSchema,
): OpenApiResponse {
  return { schema, headers };
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
  THeaders extends InferOutput<MaybeAsyncGenericSchema> | undefined = undefined,
> = {
  headers?: THeaders;
  statusCode: number;
  body: TBody;
};

interface OpenApiSpecHandler<
  TRequestSchema extends OpenApiRequest,
  TResponse extends OpenApiResponses,
> {
  error: <TStatus extends keyof TResponse>(
    data: InferInputResponseSchema<TResponse>,
    status?: TStatus,
  ) => Promise<AioOpenApiErrorResponse<InferOutputResponseSchema<TResponse>>>;
  json: <TStatus extends keyof TResponse>(
    data: InferInputResponseSchema<TResponse>,
    status?: TStatus,
    headers?: InferInputResponseHeaderObject<TResponse>,
  ) => Promise<
    AioOpenApiSuccessResponse<
      InferOutputResponseSchema<TResponse>,
      InferOutputResponseHeaderObject<TResponse>
    >
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
  validateHeaders: () => Promise<
    TRequestSchema["headers"] extends MaybeAsyncGenericSchema
      ? InferOutput<TRequestSchema["headers"]>
      : never
  >;
}

type ApiHandler<TResponse extends OpenApiResponses> = (
  params: InputRequest,
) => Promise<
  | AioOpenApiSuccessResponse<
      InferOutputResponseSchema<TResponse>,
      InferOutputResponseHeaderObject<TResponse>
    >
  | AioOpenApiErrorResponse<InferOutputResponseSchema<TResponse>>
>;

type InferInputResponseSchema<TResponse extends OpenApiResponses> = InferInput<
  TResponse[keyof TResponse]["schema"]
>;
type InferInputResponseHeaderObject<TResponse extends OpenApiResponses> =
  TResponse[keyof TResponse]["headers"] extends MaybeAsyncGenericSchema
    ? InferInput<TResponse[keyof TResponse]["headers"]>
    : undefined;

type InferOutputResponseSchema<TResponse extends OpenApiResponses> =
  InferOutput<TResponse[keyof TResponse]["schema"]>;
type InferOutputResponseHeaderObject<TResponse extends OpenApiResponses> =
  TResponse[keyof TResponse]["headers"] extends MaybeAsyncGenericSchema
    ? InferOutput<TResponse[keyof TResponse]["headers"]>
    : undefined;

export function openapi<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(
  route: Route<TRequest, TResponse>,
  handler: (
    spec: OpenApiSpecHandler<TRequest, TResponse>,
  ) => Promise<
    | AioOpenApiSuccessResponse<
        InferOutputResponseSchema<TResponse>,
        InferOutputResponseHeaderObject<TResponse>
      >
    | AioOpenApiErrorResponse<InferOutputResponseSchema<TResponse>>
  >,
): ApiHandler<TResponse> {
  const routeHandler = createRoute(route);

  return async (params: InputRequest) => {
    return await handler(routeHandler(params));
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

  const headersSchema = route.request.headers;
  const headersParser = headersSchema
    ? safeParserAsync(headersSchema)
    : undefined;

  const responseValidators: Record<
    string,
    {
      bodyValidator: ReturnType<typeof safeParserAsync>;
      headersValidator?: ReturnType<typeof safeParserAsync>;
    }
  > = {};
  for (const [statusCode, responseSchema] of Object.entries(route.responses)) {
    responseValidators[statusCode] = {
      bodyValidator: safeParserAsync(responseSchema.schema),
      headersValidator: responseSchema.headers
        ? safeParserAsync(responseSchema.headers)
        : undefined,
    };
  }

  return (params: InputRequest) => {
    return {
      async error<TStatus extends keyof TResponse>(
        data: InferInputResponseSchema<TResponse>,
        status: TStatus = "500" as TStatus,
      ) {
        const validator = responseValidators[String(status)];
        if (!validator) {
          throw new Error(
            `No response schema defined for status ${String(status)}`,
          );
        }

        const validationResult = await validator.bodyValidator(data);
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
              TResponse[TStatus]["schema"]
            >,
          },
        } satisfies AioOpenApiErrorResponse<
          InferOutputResponseSchema<TResponse>
        >;
      },
      async json<TStatus extends keyof TResponse>(
        data: InferInputResponseSchema<TResponse>,
        status: TStatus = "200" as TStatus,
        headers?: InferInputResponseHeaderObject<TResponse>,
      ) {
        const validator = responseValidators[String(status)];
        if (!validator) {
          throw new Error(
            `No response schema defined for status ${String(status)}`,
          );
        }

        // Validate body
        const bodyValidationResult = await validator.bodyValidator(data);
        if (!bodyValidationResult.success) {
          throw new CommerceSdkValidationError(
            `Invalid response for route ${route.path} with status ${String(status)}`,
            {
              issues: bodyValidationResult.issues,
            },
          );
        }

        const response: AioOpenApiSuccessResponse<
          InferOutputResponseSchema<TResponse>
        > = {
          statusCode: Number(status),
          body: bodyValidationResult.output satisfies InferOutputResponseSchema<TResponse>,
        };

        if (headers !== undefined && validator.headersValidator) {
          const headersValidationResult =
            await validator.headersValidator(headers);
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
              headersValidationResult.output as InferOutputResponseHeaderObject<TResponse>,
          } satisfies AioOpenApiSuccessResponse<
            InferOutputResponseSchema<TResponse>,
            InferOutputResponseHeaderObject<TResponse>
          >;
        }

        return response satisfies AioOpenApiSuccessResponse<
          InferOutputResponseSchema<TResponse>
        >;
      },
      async validateHeaders() {
        if (!headersParser) {
          throw new Error(`No params schema defined for route ${route.path}`);
        }

        const validationResult = await headersParser(params);
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

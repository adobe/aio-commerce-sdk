import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  type GenericSchema,
  type GenericSchemaAsync,
  type InferInput,
  type InferOutput,
  safeParseAsync,
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

export const ResponseType = {
  Error: "error",
  Success: "success",
} as const;

export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

type AioOpenApiErrorResponse<
  TBody extends InferOutput<MaybeAsyncGenericSchema>,
> = {
  type: typeof ResponseType.Error;
  error: {
    statusCode: number;
    body: TBody;
  };
};

type AioOpenApiSuccessResponse<
  TBody extends InferOutput<MaybeAsyncGenericSchema>,
  THeaders extends InferOutput<MaybeAsyncGenericSchema> | undefined = undefined,
> = {
  type: typeof ResponseType.Success;
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
    data: InferInputResponseSchemaWithStatus<TResponse, TStatus>,
    status?: TStatus,
    headers?: InferInputResponseHeaderByStatus<TResponse, TStatus>,
  ) => Promise<
    AioOpenApiSuccessResponse<
      InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
      InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
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
  validateQuery: () => Promise<
    TRequestSchema["query"] extends MaybeAsyncGenericSchema
      ? InferOutput<TRequestSchema["query"]>
      : never
  >;
}

type InferInputResponseSchema<TResponse extends OpenApiResponses> = InferInput<
  TResponse[keyof TResponse]["schema"]
>;

export type InferInputResponseHeaderByStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = TResponse[TStatus]["headers"] extends MaybeAsyncGenericSchema
  ? InferInput<TResponse[TStatus]["headers"]>
  : undefined;

type InferOutputResponseSchema<TResponse extends OpenApiResponses> =
  InferOutput<TResponse[keyof TResponse]["schema"]>;
type InferOutputResponseHeaderObject<TResponse extends OpenApiResponses> =
  TResponse[keyof TResponse]["headers"] extends MaybeAsyncGenericSchema
    ? InferOutput<TResponse[keyof TResponse]["headers"]>
    : undefined;

type InferInputResponseSchemaWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = InferInput<TResponse[TStatus]["schema"]>;
type InferOutputResponseSchemaWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = InferOutput<TResponse[TStatus]["schema"]>;
type InferOutputResponseHeaderObjectWithStatus<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
> = TResponse[TStatus]["headers"] extends MaybeAsyncGenericSchema
  ? InferOutput<TResponse[TStatus]["headers"]>
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
) {
  const routeHandler = createRoute(route);

  return (params: InputRequest) => handler(routeHandler(params));
}

function createRequestInputParser<
  TRequestSchema extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
>(request: TRequestSchema, schemaType: TField) {
  const schema = request[schemaType];

  if (!schema) {
    return;
  }

  return safeParserAsync(schema) satisfies ReturnType<typeof safeParserAsync>;
}

export function isSuccessResponse<
  TResponse extends OpenApiResponses,
  TStatus extends keyof TResponse,
>(
  status: TStatus,
  response:
    | AioOpenApiSuccessResponse<
        InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
        InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
      >
    | AioOpenApiErrorResponse<
        InferOutputResponseSchemaWithStatus<TResponse, TStatus>
      >
    | AioOpenApiSuccessResponse<
        InferOutputResponseSchema<TResponse>,
        InferOutputResponseHeaderObject<TResponse>
      >
    | AioOpenApiErrorResponse<InferOutputResponseSchema<TResponse>>,
): response is AioOpenApiSuccessResponse<
  InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
  InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
> {
  return (
    response.type === ResponseType.Success &&
    response.statusCode === Number(status)
  );
}

async function validateRequestInput<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
  TField extends "params" | "headers" | "query",
>(
  parser: ReturnType<typeof safeParserAsync> | undefined,
  params: InputRequest,
  route: Route<TRequestSchema, TResponseSchema>,
  schemaType: TField,
): Promise<
  TRequestSchema[TField] extends MaybeAsyncGenericSchema
    ? InferOutput<TRequestSchema[TField]>
    : never
> {
  if (!parser) {
    throw new Error(`No ${schemaType} schema defined for route ${route.path}`);
  }

  const validationResult = await parser(params);
  if (!validationResult.success) {
    throw new CommerceSdkValidationError(
      `Invalid ${schemaType} for route ${route.path}`,
      {
        issues: validationResult.issues,
      },
    );
  }

  return validationResult.output as TRequestSchema[TField] extends MaybeAsyncGenericSchema
    ? InferOutput<TRequestSchema[TField]>
    : never;
}

export function createRoute<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(route: Route<TRequest, TResponse>): OpenApiHandler<TRequest, TResponse> {
  const bodySchema = route.request.body?.schema;
  const bodyParser = bodySchema ? safeParserAsync(bodySchema) : undefined;

  const paramsParser = createRequestInputParser(route.request, "params");
  const queryParser = createRequestInputParser(route.request, "query");
  const headersParser = createRequestInputParser(route.request, "headers");

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
        // if (!route.responses[String(status)]) {
        //   throw new Error(
        //     `No response schema defined for status ${String(status)} in route ${route.path}`,
        //   );
        // }

        const responseSpec = route.responses[String(status)];

        if (responseSpec.headers) {
          const responseHeadersParser =
            responseValidators[String(status)].headersValidator;
          if (!responseHeadersParser) {
            throw new Error(
              `No headers schema defined for status ${String(status)} in route ${route.path}`,
            );
          }
          const headersValidationResult = await responseHeadersParser(params);
          if (!headersValidationResult.success) {
            throw new CommerceSdkValidationError(
              `Invalid headers for route ${route.path} with status ${String(status)}`,
              {
                issues: headersValidationResult.issues,
              },
            );
          }
        }

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
        } satisfies AioOpenApiErrorResponse<
          InferOutputResponseSchema<TResponse>
        >;
      },
      async json<TStatus extends keyof TResponse>(
        data: InferInputResponseSchema<TResponse>,
        status: TStatus = "200" as TStatus,
        headers?: InferInputResponseHeaderByStatus<TResponse, TStatus>,
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

        const response = {
          type: ResponseType.Success,
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
            InferOutputResponseSchemaWithStatus<TResponse, TStatus>,
            InferOutputResponseHeaderObjectWithStatus<TResponse, TStatus>
          >;
        }

        return response satisfies AioOpenApiSuccessResponse<
          InferOutputResponseSchemaWithStatus<TResponse, TStatus>
        >;
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
      validateHeaders: () =>
        validateRequestInput(headersParser, params, route, "headers"),
      validateParams: () =>
        validateRequestInput(paramsParser, params, route, "params"),
      validateQuery: () =>
        validateRequestInput(queryParser, params, route, "query"),
    } satisfies OpenApiSpecHandler<TRequest, TResponse>;
  };
}

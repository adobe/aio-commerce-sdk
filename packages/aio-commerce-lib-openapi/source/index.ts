import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { safeParseAsync, safeParserAsync } from "valibot";

import { error } from "~/error";
import { json } from "~/json";

import type {
  ErrorResponsesBodyInput,
  ErrorResponsesHeaderInput,
  InputRequest,
  OpenApiRequest,
  OpenApiResponse,
  OpenApiResponses,
  OpenApiSpecHandler,
  RequestBodyOutput,
  RequestValidatorOutput,
  ResponsesBodyInput,
  ResponsesHeaderInput,
  Route,
} from "~/common";
import type {
  ErrorStatusCode,
  ErrorStatusCodeString,
  HttpStatusCode,
  SuccessStatusCode,
  SuccessStatusCodeString,
} from "~/http";

export function openapi<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses<SuccessStatusCode>,
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

function isOpenApiResponse(value: unknown): value is OpenApiResponse {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "schema" in value
  );
}

function getResponseSpecByStatus<
  TStatus extends HttpStatusCode,
  TResponses extends OpenApiResponses = OpenApiResponses,
>(status: TStatus, responses: TResponses, routePath: string): OpenApiResponse {
  const response = responses[status];

  if (!isOpenApiResponse(response)) {
    throw new Error(
      `No valid response schema defined for status ${status} in route ${routePath}`,
    );
  }

  return response;
}

export function createRoute<
  TRequest extends OpenApiRequest,
  TResponse extends OpenApiResponses,
>(route: Route<TRequest, TResponse>) {
  const bodySchema = route.request.body?.schema;
  const bodyParser = bodySchema ? safeParserAsync(bodySchema) : undefined;

  return (requestInputParams: InputRequest) => {
    return {
      async error<TStatus extends ErrorStatusCodeString & ErrorStatusCode>(
        data: ErrorResponsesBodyInput<TResponse, TStatus>,
        status: TStatus,
        headers?: ErrorResponsesHeaderInput<TResponse, TStatus>,
      ) {
        const responseSpec = getResponseSpecByStatus(
          status,
          route.responses,
          route.path,
        );

        return await error(
          {
            method: route.method,
            path: route.path,
            status,
            response: responseSpec,
          },
          data,
          headers,
        );
      },
      async json<TStatus extends SuccessStatusCodeString & SuccessStatusCode>(
        data: ResponsesBodyInput<TResponse, TStatus>,
        status: TStatus,
        headers?: ResponsesHeaderInput<TResponse, TStatus>,
      ) {
        const responseSpec = getResponseSpecByStatus(
          status,
          route.responses,
          route.path,
        );

        return await json(
          {
            method: route.method,
            path: route.path,
            status,
            response: responseSpec,
          },
          data,
          headers,
        );
      },
      async validateBody() {
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

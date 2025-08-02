import type {
  GenericSchema,
  GenericSchemaAsync,
  InferInput,
  InferOutput,
} from "valibot";
import type { ErrorBodyInput, ErrorHeaderInput, error } from "~/error";
import type {
  ErrorStatusCode,
  ErrorStatusCodeString,
  HttpMethod,
  HttpStatusCode,
  SuccessStatusCode,
  SuccessStatusCodeString,
} from "~/http";
import type { json, ResponseBodyInput, ResponseHeaderInput } from "~/json";

export type AioOpenApiErrorResponse<TBody, THeaders = undefined> = {
  error: {
    statusCode: number;
    body: TBody;
    headers?: THeaders;
  };
};

export type InferInputResponseHeaderByStatus<
  TResponse extends OpenApiResponse,
> = TResponse["headers"] extends MaybeAsyncGenericSchema
  ? InferInput<TResponse["headers"]>
  : undefined;

export type InferInputResponseSchema<TResponse extends OpenApiResponse> =
  InferInput<TResponse["schema"]>;

export type InputRequest = Record<PropertyKey, unknown>;
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
export type OpenApiResponses<TKey extends HttpStatusCode = HttpStatusCode> =
  Partial<Record<TKey, OpenApiResponse>>;

export type RequestBodyOutput<TRequest extends OpenApiRequest> =
  TRequest["body"] extends {
    schema: infer TSchema extends MaybeAsyncGenericSchema;
  }
    ? InferOutput<TSchema>
    : never;

type RequestValidatorFunction<
  TRequest extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
> = () => Promise<RequestValidatorOutput<TRequest, TField>>;

export type RequestValidatorOutput<
  TRequest extends OpenApiRequest,
  TField extends "params" | "headers" | "query",
> = TRequest[TField] extends MaybeAsyncGenericSchema
  ? InferOutput<TRequest[TField]>
  : never;

export type ResponsesBodyInput<
  TResponses extends OpenApiResponses,
  TStatus extends SuccessStatusCodeString & SuccessStatusCode,
> = TResponses[TStatus] extends OpenApiResponse
  ? ResponseBodyInput<TResponses[TStatus]>
  : never;

export type ResponsesHeaderInput<
  TResponses extends OpenApiResponses,
  TStatus extends SuccessStatusCodeString & SuccessStatusCode,
> = TResponses[TStatus] extends OpenApiResponse
  ? ResponseHeaderInput<TResponses[TStatus]>
  : undefined;

export type ErrorResponsesBodyInput<
  TResponses extends OpenApiResponses,
  TStatus extends ErrorStatusCodeString & ErrorStatusCode,
> = TResponses[TStatus] extends OpenApiResponse
  ? ErrorBodyInput<TResponses[TStatus]>
  : never;

export type ErrorResponsesHeaderInput<
  TResponses extends OpenApiResponses,
  TStatus extends ErrorStatusCodeString & ErrorStatusCode,
> = TResponses[TStatus] extends OpenApiResponse
  ? ErrorHeaderInput<TResponses[TStatus]>
  : undefined;

// Interfaces (alphabetically ordered)
export interface OpenApiSpecHandler<
  TRequestSchema extends OpenApiRequest,
  TResponse extends OpenApiResponses,
> {
  error: <TStatus extends ErrorStatusCodeString & ErrorStatusCode>(
    data: ErrorResponsesBodyInput<TResponse, TStatus>,
    status: TStatus,
    headers?: ErrorResponsesHeaderInput<TResponse, TStatus>,
  ) => ReturnType<typeof error>;
  json: <TStatus extends SuccessStatusCodeString & SuccessStatusCode>(
    data: ResponsesBodyInput<TResponse, TStatus>,
    status: TStatus,
    headers?: ResponsesHeaderInput<TResponse, TStatus>,
  ) => ReturnType<typeof json>;
  validateBody: () => Promise<RequestBodyOutput<TRequestSchema>>;
  validateParams: RequestValidatorFunction<TRequestSchema, "params">;
  validateHeaders: RequestValidatorFunction<TRequestSchema, "headers">;
  validateQuery: RequestValidatorFunction<TRequestSchema, "query">;
}

export interface Route<
  TRequestSchema extends OpenApiRequest,
  TResponseSchema extends OpenApiResponses,
> {
  method: HttpMethod;
  path: string;
  request: TRequestSchema;
  responses: TResponseSchema;
}

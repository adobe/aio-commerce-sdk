# `responses`: Module

## Type Aliases

| Type Alias                                         | Description                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [ActionResponse](type-aliases/ActionResponse.md)   | Union type representing either a successful or error response from a runtime action |
| [ErrorResponse](type-aliases/ErrorResponse.md)     | Represents an error response from a runtime action                                  |
| [SuccessResponse](type-aliases/SuccessResponse.md) | Represents a successful response from a runtime action                              |

## Variables

| Variable                                                                              | Description                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [accepted](variables/accepted.md)                                                     | Creates a success response with the HTTP status code 202. See [buildSuccessResponse](functions/buildSuccessResponse.md) for details on the response payload. |
| [badRequest](variables/badRequest.md)                                                 | Creates an error response with the HTTP status code 400. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [conflict](variables/conflict.md)                                                     | Creates an error response with the HTTP status code 409. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [created](variables/created.md)                                                       | Creates a success response with the HTTP status code 201. See [buildSuccessResponse](functions/buildSuccessResponse.md) for details on the response payload. |
| [forbidden](variables/forbidden.md)                                                   | Creates an error response with the HTTP status code 403. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [HTTP_ACCEPTED](variables/HTTP_ACCEPTED.md)                                           | -                                                                                                                                                            |
| [HTTP_BAD_REQUEST](variables/HTTP_BAD_REQUEST.md)                                     | -                                                                                                                                                            |
| [HTTP_CONFLICT](variables/HTTP_CONFLICT.md)                                           | -                                                                                                                                                            |
| [HTTP_CREATED](variables/HTTP_CREATED.md)                                             | -                                                                                                                                                            |
| [HTTP_FORBIDDEN](variables/HTTP_FORBIDDEN.md)                                         | -                                                                                                                                                            |
| [HTTP_INTERNAL_SERVER_ERROR](variables/HTTP_INTERNAL_SERVER_ERROR.md)                 | -                                                                                                                                                            |
| [HTTP_METHOD_NOT_ALLOWED](variables/HTTP_METHOD_NOT_ALLOWED.md)                       | -                                                                                                                                                            |
| [HTTP_NO_CONTENT](variables/HTTP_NO_CONTENT.md)                                       | -                                                                                                                                                            |
| [HTTP_NON_AUTHORITATIVE_INFORMATION](variables/HTTP_NON_AUTHORITATIVE_INFORMATION.md) | -                                                                                                                                                            |
| [HTTP_NOT_FOUND](variables/HTTP_NOT_FOUND.md)                                         | -                                                                                                                                                            |
| [HTTP_OK](variables/HTTP_OK.md)                                                       | -                                                                                                                                                            |
| [HTTP_UNAUTHORIZED](variables/HTTP_UNAUTHORIZED.md)                                   | -                                                                                                                                                            |
| [internalServerError](variables/internalServerError.md)                               | Creates an error response with the HTTP status code 500. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [methodNotAllowed](variables/methodNotAllowed.md)                                     | Creates an error response with the HTTP status code 405. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [nonAuthoritativeInformation](variables/nonAuthoritativeInformation.md)               | Creates a success response with the HTTP status code 203. See [buildSuccessResponse](functions/buildSuccessResponse.md) for details on the response payload. |
| [notFound](variables/notFound.md)                                                     | Creates an error response with the HTTP status code 404. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |
| [ok](variables/ok.md)                                                                 | Creates a success response with the HTTP status code 200. See [buildSuccessResponse](functions/buildSuccessResponse.md) for details on the response payload. |
| [unauthorized](variables/unauthorized.md)                                             | Creates an error response with the HTTP status code 401. See [buildErrorResponse](functions/buildErrorResponse.md) for details on the response payload.      |

## Functions

| Function                                                  | Description                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [buildErrorResponse](functions/buildErrorResponse.md)     | Creates a standardized error response for runtime actions                                         |
| [buildSuccessResponse](functions/buildSuccessResponse.md) | Creates a standardized success response for runtime actions                                       |
| [noContent](functions/noContent.md)                       | Creates a success response with the HTTP status code 204 (No Content). This response has no body. |

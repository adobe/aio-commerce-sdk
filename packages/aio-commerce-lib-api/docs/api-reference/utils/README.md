# `utils`: Module

## Type Aliases

| Type Alias                                                                         | Description                                                     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [ImsAuthParamsWithOptionalScopes](type-aliases/ImsAuthParamsWithOptionalScopes.md) | Defines the IMS authentication parameters with optional scopes. |

## Variables

| Variable                                                                 | Description                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| [HTTP\_BAD\_REQUEST](variables/HTTP_BAD_REQUEST.md)                      | The HTTP status code for a bad request.            |
| [HTTP\_FORBIDDEN](variables/HTTP_FORBIDDEN.md)                           | The HTTP status code for a forbidden request.      |
| [HTTP\_INTERNAL\_SERVER\_ERROR](variables/HTTP_INTERNAL_SERVER_ERROR.md) | The HTTP status code for an internal server error. |
| [HTTP\_NOT\_FOUND](variables/HTTP_NOT_FOUND.md)                          | The HTTP status code for a not found request.      |
| [HTTP\_OK](variables/HTTP_OK.md)                                         | The HTTP status code for a successful request.     |
| [HTTP\_UNAUTHORIZED](variables/HTTP_UNAUTHORIZED.md)                     | The HTTP status code for an unauthorized request.  |

## Functions

| Function                                                                                    | Description                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [buildImsAuthBeforeRequestHook](functions/buildImsAuthBeforeRequestHook.md)                 | Builds a before request hook for IMS authentication.                                                                                        |
| [buildIntegrationAuthBeforeRequestHook](functions/buildIntegrationAuthBeforeRequestHook.md) | Builds a before request hook for integration authentication.                                                                                |
| [isAuthProvider](functions/isAuthProvider.md)                                               | Type guard to check if the given auth object is an auth provider.                                                                           |
| [unwrapHttpError](functions/unwrapHttpError.md)                                             | Unwraps a ky `HTTPError` to produce a human-readable string that includes the HTTP status and the message extracted from the response body. |

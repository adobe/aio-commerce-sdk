# `utils`: Module

## Type Aliases

| Type Alias                                                                         | Description                                                     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [ImsAuthParamsWithOptionalScopes](type-aliases/ImsAuthParamsWithOptionalScopes.md) | Defines the IMS authentication parameters with optional scopes. |

## Variables

| Variable                                                              | Description                                        |
| --------------------------------------------------------------------- | -------------------------------------------------- |
| [HTTP_BAD_REQUEST](variables/HTTP_BAD_REQUEST.md)                     | The HTTP status code for a bad request.            |
| [HTTP_FORBIDDEN](variables/HTTP_FORBIDDEN.md)                         | The HTTP status code for a forbidden request.      |
| [HTTP_INTERNAL_SERVER_ERROR](variables/HTTP_INTERNAL_SERVER_ERROR.md) | The HTTP status code for an internal server error. |
| [HTTP_NOT_FOUND](variables/HTTP_NOT_FOUND.md)                         | The HTTP status code for a not found request.      |
| [HTTP_OK](variables/HTTP_OK.md)                                       | The HTTP status code for a successful request.     |
| [HTTP_UNAUTHORIZED](variables/HTTP_UNAUTHORIZED.md)                   | The HTTP status code for an unauthorized request.  |

## Functions

| Function                                                                                    | Description                                                                                  |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [buildCamelCaseKeysResponseHook](functions/buildCamelCaseKeysResponseHook.md)               | Builds a hook that transforms the keys of an object to camel case.                           |
| [buildImsAuthBeforeRequestHook](functions/buildImsAuthBeforeRequestHook.md)                 | Builds a before request hook for IMS authentication.                                         |
| [buildIntegrationAuthBeforeRequestHook](functions/buildIntegrationAuthBeforeRequestHook.md) | Builds a before request hook for integration authentication.                                 |
| [buildObjectKeyTransformerResponseHook](functions/buildObjectKeyTransformerResponseHook.md) | Builds a hook that transforms the keys of an object using the provided transformer function. |
| [isAuthProvider](functions/isAuthProvider.md)                                               | Type guard to check if the given auth object is an auth provider.                            |

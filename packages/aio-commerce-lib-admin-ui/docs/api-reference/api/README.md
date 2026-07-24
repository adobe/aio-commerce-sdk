# `api`: Module

## Classes

| Class                                                                   | Description                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [AdminUiPermissionDeniedError](classes/AdminUiPermissionDeniedError.md) | Error thrown when the current user is denied access to an Admin UI SDK ACL resource. |
| [AdminUiPermissionError](classes/AdminUiPermissionError.md)             | Base error for Admin UI SDK permission helper failures.                              |

## Type Aliases

| Type Alias                                                                                 | Description                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [AdminUiApiClient](type-aliases/AdminUiApiClient.md)                                       | An API client for the Admin UI API with all operations.                                     |
| [AdminUiEntity](type-aliases/AdminUiEntity.md)                                             | Commerce entity an Admin UI component is attached to.                                       |
| [AdminUiPermissionClient](type-aliases/AdminUiPermissionClient.md)                         | Client for checking the current user's Admin UI SDK resource permissions.                   |
| [AdminUiPermissionClientOptions](type-aliases/AdminUiPermissionClientOptions.md)           | Options used to create an Admin UI SDK permission client.                                   |
| [AdminUiPermissionDeniedErrorOptions](type-aliases/AdminUiPermissionDeniedErrorOptions.md) | Options for [AdminUiPermissionDeniedError](classes/AdminUiPermissionDeniedError.md).        |
| [ExtensionRegistrationParams](type-aliases/ExtensionRegistrationParams.md)                 | The parameters accepted by POST /V1/adminuisdk/extension.                                   |
| [PermissionCheckResponse](type-aliases/PermissionCheckResponse.md)                         | Parsed Admin UI SDK permission check response.                                              |
| [RegisterExtensionResponse](type-aliases/RegisterExtensionResponse.md)                     | The response returned by POST /V1/adminuisdk/extension.                                     |
| [UnregisterExtensionParams](type-aliases/UnregisterExtensionParams.md)                     | The parameters accepted by DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. |

## Variables

| Variable                                                                            | Description                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [ExtensionRegistrationParamsSchema](variables/ExtensionRegistrationParamsSchema.md) | Parameters for POST /V1/adminuisdk/extension.                                   |
| [permissionCheckResponseSchema](variables/permissionCheckResponseSchema.md)         | Response shape returned by the Admin UI SDK permission check endpoint.          |
| [UnregisterExtensionParamsSchema](variables/UnregisterExtensionParamsSchema.md)     | Parameters for DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. |

## Functions

| Function                                                              | Description                                                                         |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [createAdminUiApiClient](functions/createAdminUiApiClient.md)         | Creates a new API client for the Admin UI API with all available operations.        |
| [getAclResourceId](functions/getAclResourceId.md)                     | Derives the deterministic Commerce ACL resource id for an app from its metadata id. |
| [getAdminUiPermissionClient](functions/getAdminUiPermissionClient.md) | Creates a client for checking Admin UI SDK ACL resources.                           |

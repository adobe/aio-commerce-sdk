# `api`: Module

## Classes

| Class                                                                   | Description                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [AdminUiPermissionDeniedError](classes/AdminUiPermissionDeniedError.md) | Error thrown when the current user is denied access to an Admin UI SDK ACL resource. |
| [AdminUiPermissionError](classes/AdminUiPermissionError.md)             | Base error for Admin UI SDK permission helper failures.                              |

## Type Aliases

| Type Alias                                                                                 | Description                                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| [AdminUiApiClient](type-aliases/AdminUiApiClient.md)                                       | An API client for the Admin UI API with all operations.                                           |
| [AdminUiEntity](type-aliases/AdminUiEntity.md)                                             | Commerce entity an Admin UI component is attached to.                                             |
| [AdminUiPermissionClient](type-aliases/AdminUiPermissionClient.md)                         | Client for checking the current user's Admin UI SDK resource permissions.                         |
| [AdminUiPermissionClientOptions](type-aliases/AdminUiPermissionClientOptions.md)           | Options used to create an Admin UI SDK permission client.                                         |
| [AdminUiPermissionDeniedErrorOptions](type-aliases/AdminUiPermissionDeniedErrorOptions.md) | Options for [AdminUiPermissionDeniedError](classes/AdminUiPermissionDeniedError.md).              |
| [ExtensionRegistrationParams](type-aliases/ExtensionRegistrationParams.md)                 | The parameters accepted by POST /V1/adminuisdk/extension.                                         |
| [PermissionCheckResponse](type-aliases/PermissionCheckResponse.md)                         | Parsed Admin UI SDK permission check response.                                                    |
| [RefreshExtensionParams](type-aliases/RefreshExtensionParams.md)                           | The parameters accepted by POST /V1/adminuisdk/extension/{workspaceName}/{extensionName}/refresh. |
| [RegisterExtensionResponse](type-aliases/RegisterExtensionResponse.md)                     | The response returned by POST /V1/adminuisdk/extension.                                           |
| [UnregisterExtensionParams](type-aliases/UnregisterExtensionParams.md)                     | The parameters accepted by DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}.       |

## Variables

| Variable                                                                            | Description                                                                           |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [ExtensionRegistrationParamsSchema](variables/ExtensionRegistrationParamsSchema.md) | Parameters for POST /V1/adminuisdk/extension.                                         |
| [permissionCheckResponseSchema](variables/permissionCheckResponseSchema.md)         | Response shape returned by the Admin UI SDK permission check endpoint.                |
| [RefreshExtensionParamsSchema](variables/RefreshExtensionParamsSchema.md)           | Parameters for POST /V1/adminuisdk/extension/{workspaceName}/{extensionName}/refresh. |
| [UnregisterExtensionParamsSchema](variables/UnregisterExtensionParamsSchema.md)     | Parameters for DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}.       |

## Functions

| Function                                                              | Description                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [createAdminUiApiClient](functions/createAdminUiApiClient.md)         | Creates a new API client for the Admin UI API with all available operations.                                                                                                                                                                                                     |
| [getAclResourceId](functions/getAclResourceId.md)                     | Derives the deterministic Commerce ACL resource id for an app from its metadata id.                                                                                                                                                                                              |
| [getAdminUiPermissionClient](functions/getAdminUiPermissionClient.md) | Creates a client for checking Admin UI SDK ACL resources.                                                                                                                                                                                                                        |
| [getCustomAclResourceId](functions/getCustomAclResourceId.md)         | Derives the deterministic Commerce ACL resource id for a custom (standalone) ACL resource declared under `adminUi.acl`. Mirrors the Commerce `AclResourceIdGenerator` `acl` token exactly.                                                                                       |
| [sanitizeSegment](functions/sanitizeSegment.md)                       | Sanitizes a single ACL id segment: trims whitespace, lowercases, and replaces every character outside [a-z0-9_] with an underscore. This mirrors the Commerce module's own per-segment normalization — the same step applied when building any ACL resource id from a config id. |

# `@adobe/aio-commerce-lib-admin-ui`: `v0.1.0`

## Type Aliases

| Type Alias                                                                 | Description                                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [AdminUiApiClient](type-aliases/AdminUiApiClient.md)                       | An API client for the Admin UI API with all operations.                                     |
| [ExtensionRegistrationParams](type-aliases/ExtensionRegistrationParams.md) | The parameters accepted by POST /V1/adminuisdk/extension.                                   |
| [RegisterExtensionResponse](type-aliases/RegisterExtensionResponse.md)     | The response returned by POST /V1/adminuisdk/extension.                                     |
| [UnregisterExtensionParams](type-aliases/UnregisterExtensionParams.md)     | The parameters accepted by DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. |

## Variables

| Variable                                                                            | Description                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [ExtensionRegistrationParamsSchema](variables/ExtensionRegistrationParamsSchema.md) | Parameters for POST /V1/adminuisdk/extension.                                   |
| [UnregisterExtensionParamsSchema](variables/UnregisterExtensionParamsSchema.md)     | Parameters for DELETE /V1/adminuisdk/extension/{workspaceName}/{extensionName}. |

## Functions

| Function                                                      | Description                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [createAdminUiApiClient](functions/createAdminUiApiClient.md) | Creates a new API client for the Admin UI API with all available operations. |

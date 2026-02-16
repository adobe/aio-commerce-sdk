# `@adobe/aio-commerce-lib-auth`: `v0.8.1`

## Type Aliases

| Type Alias                                                         | Description                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [ForwardedImsAuthSource](type-aliases/ForwardedImsAuthSource.md)   | Discriminated union for different sources of forwarded IMS auth credentials. |
| [ImsAuthEnv](type-aliases/ImsAuthEnv.md)                           | Defines the environments accepted by the IMS auth service.                   |
| [ImsAuthHeaders](type-aliases/ImsAuthHeaders.md)                   | Defines the headers required for IMS authentication.                         |
| [ImsAuthParams](type-aliases/ImsAuthParams.md)                     | Defines the parameters for the IMS auth service.                             |
| [ImsAuthProvider](type-aliases/ImsAuthProvider.md)                 | Defines an authentication provider for Adobe IMS.                            |
| [IntegrationAuthParams](type-aliases/IntegrationAuthParams.md)     | Defines the parameters required for Commerce Integration authentication.     |
| [IntegrationAuthProvider](type-aliases/IntegrationAuthProvider.md) | Defines an authentication provider for Adobe Commerce integrations.          |

## Functions

| Function                                                                | Description                                                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [assertImsAuthParams](functions/assertImsAuthParams.md)                 | Asserts the provided configuration for an [ImsAuthProvider](type-aliases/ImsAuthProvider.md).                                                                                             |
| [assertIntegrationAuthParams](functions/assertIntegrationAuthParams.md) | Asserts the provided configuration for an Adobe Commerce [IntegrationAuthProvider](type-aliases/IntegrationAuthProvider.md).                                                              |
| [forwardImsAuthProvider](functions/forwardImsAuthProvider.md)           | Creates an [ImsAuthProvider](type-aliases/ImsAuthProvider.md) by forwarding authentication credentials from runtime action parameters.                                                    |
| [getForwardedImsAuthProvider](functions/getForwardedImsAuthProvider.md) | Creates an [ImsAuthProvider](type-aliases/ImsAuthProvider.md) by forwarding authentication credentials from various sources.                                                              |
| [getImsAuthProvider](functions/getImsAuthProvider.md)                   | Creates an [ImsAuthProvider](type-aliases/ImsAuthProvider.md) based on the provided configuration.                                                                                        |
| [getIntegrationAuthProvider](functions/getIntegrationAuthProvider.md)   | Creates an [IntegrationAuthProvider](type-aliases/IntegrationAuthProvider.md) based on the provided configuration.                                                                        |
| [isImsAuthProvider](functions/isImsAuthProvider.md)                     | Type guard to check if a value is an ImsAuthProvider instance.                                                                                                                            |
| [isIntegrationAuthProvider](functions/isIntegrationAuthProvider.md)     | Type guard to check if a value is an IntegrationAuthProvider instance.                                                                                                                    |
| [resolveAuthParams](functions/resolveAuthParams.md)                     | Automatically detects and resolves authentication parameters from App Builder action inputs. Attempts to resolve IMS authentication first, then falls back to Integration authentication. |

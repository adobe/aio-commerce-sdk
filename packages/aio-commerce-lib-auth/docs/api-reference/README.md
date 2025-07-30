# `@adobe/aio-commerce-lib-auth`: `v0.3.1`

## Interfaces

| Interface                                                        | Description                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| [ImsAuthProvider](interfaces/ImsAuthProvider.md)                 | Defines an authentication provider for Adobe IMS.                   |
| [IntegrationAuthProvider](interfaces/IntegrationAuthProvider.md) | Defines an authentication provider for Adobe Commerce integrations. |

## Type Aliases

| Type Alias                                                     | Description                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [ImsAuthEnv](type-aliases/ImsAuthEnv.md)                       | Defines the environments accepted by the IMS auth service.               |
| [ImsAuthParams](type-aliases/ImsAuthParams.md)                 | Defines the parameters for the IMS auth service.                         |
| [IntegrationAuthParams](type-aliases/IntegrationAuthParams.md) | Defines the parameters required for Commerce Integration authentication. |

## Variables

| Variable                                  | Description                                        |
| ----------------------------------------- | -------------------------------------------------- |
| [IMS_AUTH_ENV](variables/IMS_AUTH_ENV.md) | The environments accepted by the IMS auth service. |

## Functions

| Function                                                                | Description                                                                                                                |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [assertImsAuthParams](functions/assertImsAuthParams.md)                 | Asserts the provided configuration for an [ImsAuthProvider](interfaces/ImsAuthProvider.md).                                |
| [assertIntegrationAuthParams](functions/assertIntegrationAuthParams.md) | Asserts the provided configuration for an Adobe Commerce [IntegrationAuthProvider](interfaces/IntegrationAuthProvider.md). |
| [getImsAuthProvider](functions/getImsAuthProvider.md)                   | Creates an [ImsAuthProvider](interfaces/ImsAuthProvider.md) based on the provided configuration.                           |
| [getIntegrationAuthProvider](functions/getIntegrationAuthProvider.md)   | Creates an [IntegrationAuthProvider](interfaces/IntegrationAuthProvider.md) based on the provided configuration.           |

# `@aio-commerce-sdk/aio-commerce-lib-api`: `v0.1.0`

## Classes

| Class                                                         | Description                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [AdobeCommerceHttpClient](classes/AdobeCommerceHttpClient.md) | A Ky-based HTTP client used to make requests to the Commerce API.                               |
| [AdobeIoEventsHttpClient](classes/AdobeIoEventsHttpClient.md) | A Ky-based HTTP client used to make requests to the Adobe I/O Events API.                       |
| [ApiClient](classes/ApiClient.md)                             | A client that binds a set of [ApiFunction](type-aliases/ApiFunction.md) to a given HTTP client. |

## Type Aliases

| Type Alias                                                                   | Description                                                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [ApiClientRecord](type-aliases/ApiClientRecord.md)                           | A client that bounds a set of [ApiFunction](type-aliases/ApiFunction.md) to their HTTP clients. |
| [ApiFunction](type-aliases/ApiFunction.md)                                   | A generic function that takes an HTTP client and some other arguments and returns a result.     |
| [CommerceFlavor](type-aliases/CommerceFlavor.md)                             | Defines the flavor of a Commerce instance.                                                      |
| [CommerceHttpClientConfig](type-aliases/CommerceHttpClientConfig.md)         | Defines the configuration required to build an Adobe Commerce HTTP client.                      |
| [CommerceHttpClientConfigPaaS](type-aliases/CommerceHttpClientConfigPaaS.md) | Defines the configuration required to build an Adobe Commerce HTTP client for PaaS.             |
| [CommerceHttpClientConfigSaaS](type-aliases/CommerceHttpClientConfigSaaS.md) | Defines the configuration required to build an Adobe Commerce HTTP client for SaaS.             |
| [CommerceHttpClientParams](type-aliases/CommerceHttpClientParams.md)         | Defines the parameters required to build an Adobe Commerce HTTP client (either SaaS or PaaS).   |
| [IoEventsHttpClientConfig](type-aliases/IoEventsHttpClientConfig.md)         | Defines the configuration required to build an Adobe I/O HTTP client.                           |
| [IoEventsHttpClientParams](type-aliases/IoEventsHttpClientParams.md)         | Defines the parameters required to build an HTTP client for the Adobe I/O Events API.           |
| [PaaSClientParams](type-aliases/PaaSClientParams.md)                         | Defines the configuration required to build an Adobe Commerce HTTP client for PaaS.             |
| [SaaSClientParams](type-aliases/SaaSClientParams.md)                         | Defines the configuration required to build an Adobe Commerce HTTP client for SaaS.             |

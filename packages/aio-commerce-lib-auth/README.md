# @adobe/aio-commerce-lib-auth

Authentication utilities for Adobe Commerce apps deployed in Adobe App Builder.

It supports two main authentication providers:

- **IMS Provider**: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2.
- **Integrations Provider**: For authenticating with Adobe Commerce integrations using OAuth 1.0a.

These providers abstract the complexity of authentication, making it easy to obtain and use access tokens in your App Builder applications.

## Installation

```shell
npm install @adobe/aio-commerce-lib-auth
```

## Usage

In your App Builder application, you can use the library to authenticate users or services and obtain access tokens.

### IMS Provider

In the runtime action you can generate an access token using the IMS Provider:

```typescript
import { tryGetImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

const params = {
  AIO_COMMERCE_IMS_CLIENT_ID: "...",
  AIO_COMMERCE_IMS_CLIENT_SECRETS: "[\"secret1\",\"secret2\"]",
  AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: "...",
  AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: "...",
  AIO_COMMERCE_IMS_IMS_ORG_ID: "...",
  AIO_COMMERCE_IMS_ENV: "prod",
  AIO_COMMERCE_IMS_SCOPES: "[\"scope1\",\"scope2\"]",
  AIO_COMMERCE_IMS_CTX: "aio-commerce-sdk-creds"
};

const result = await tryGetImsAuthProvider(params);

if (result.success) {
  const imsAuthProvider = result.value;
  const headersResult = await imsAuthProvider.getHeaders();
  if (headersResult.success) {
    // Use headersResult.value for API requests
  } else {
    // Handle header generation error
  }
} else {
  // Handle parameter validation error
}
```

### Integrations Provider

In the runtime action you can generate an access token using the Integrations Provider:

```typescript
import { tryGetIntegrationAuthProvider } from "@adobe/aio-commerce-lib-auth";

const params = {
  AIO_COMMERCE_INTEGRATIONS_CONSUMER_KEY: "...",
  AIO_COMMERCE_INTEGRATIONS_CONSUMER_SECRET: "...",
  AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN: "...",
  AIO_COMMERCE_INTEGRATIONS_ACCESS_TOKEN_SECRET: "..."
};

const result = tryGetIntegrationAuthProvider(params);

if (result.success) {
  const provider = result.value;
  const headersResult = provider.getHeaders("GET", "https://example.com/rest/V1/orders");
  if (headersResult.success) {
    // Use headersResult.value for API requests
  } else {
    // Handle header generation error
  }
} else {
  // Handle parameter validation error
}
```

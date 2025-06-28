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
import { getImsAuthProvider } from '@adobe/aio-commerce-lib-auth';

export const main = async function (params: Record<string, unknown>) {
  // Generate the needed headers for API requests
  const imsAuth = getImsAuthProvider(params);
  const headers = await imsAuth.getHeaders();

  return { statusCode: 200 };
};
```

### Integrations Provider

In the runtime action you can generate an access token using the Integrations Provider:

```typescript
import { getIntegrationsAuthProvider } from '@adobe/aio-commerce-lib-auth';

export const main = async function (params: Record<string, unknown>) {
  // Generate the needed headers for API requests
  const integrationsAuth = getIntegrationsAuthProvider(params);
  const headers = integrationsAuth.getHeaders('GET', 'http://localhost/rest/V1/orders');

  return { statusCode: 200 };
};
```

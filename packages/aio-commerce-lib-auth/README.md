# @adobe/aio-commerce-lib-auth

Authentication utilities for Adobe Commerce apps deployed in Adobe AppBuilder.

It supports two main authentication providers:

- IMS Provider: For authenticating users or services via Adobe Identity Management System (IMS) using OAuth2.
- Integrations Provider: For authenticating with Adobe Commerce integrations using OAuth 1.0a.

These providers abstract the complexity of authentication, making it easy to obtain and use access tokens in your AppBuilder applications.
By supporting both, this SDK enables flexible authentication for a variety of Adobe Commerce and Adobe AppBuilder use cases.

## Installation

```shell
npm install @adobe/aio-commerce-lib-auth
```

## Usage

In your AppBuilder application, you can use the SDK to authenticate users or services and obtain access tokens.

### IMS Provider

In the runtime action you can generate an access token using the IMS Provider:

```javascript
const { getImsAuthProvider } = require('@adobe/aio-commerce-lib-auth');

exports.main = async function (params) {
  const imsAuth = getImsAuthProvider(params);

  // Generate the needed headers for API requests
  const headers = await imsAuth.getHeaders();

  return { statusCode: 200 };
};
```

### Integrations Provider

In the runtime action you can generate an access token using the Integrations Provider:

```javascript
const { getIntegrationsAuthProvider } = require('@adobe/aio-commerce-lib-auth');

exports.main = async function (params) {
  const integrationsAuth = getIntegrationsAuthProvider(params);

  // Generate the needed headers for API requests
  const headers = integrationsAuth.getHeaders('GET', 'http://localhost/rest/V1/orders');

  return { statusCode: 200 };
};
```

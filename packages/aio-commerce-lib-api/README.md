# `@adobe/aio-commerce-lib-api`

A set of utilities to build HTTP/API clients for Adobe I/O Events and Adobe Commerce APIs.

This library provides a unified interface for building HTTP clients that can communicate with Adobe Commerce (both SaaS and PaaS) and Adobe I/O Events APIs, with built-in authentication support and a flexible API function binding system.

## Installation

```bash
pnpm add @adobe/aio-commerce-lib-api
```

## Usage

See the [Usage Guide](docs/usage.md) for more information.

## Admin UI SDK Permission Helper

Use `getAdminUiSdkPermissionClient({ httpClient, cacheTtlMs?, denyOnError? })` to check Admin UI SDK ACL resources from a SPA or runtime action. The helper calls the Commerce Admin UI SDK permission endpoint, caches successful endpoint results for 5 minutes by default, deduplicates concurrent checks for the same resource, and fails closed by returning `false` from `check` on network or response-shape errors. A `401` response from `check` or `require` always throws because it indicates an authentication configuration issue. Set `denyOnError: false` to throw on all errors.

```ts
import {
  AdobeCommerceHttpClient,
  getAdminUiSdkPermissionClient,
  withAdminUiSdkPermission,
} from "@adobe/aio-commerce-lib-api";

const httpClient = new AdobeCommerceHttpClient({
  config: {
    baseUrl,
    flavor: "paas",
  },
  auth: {
    getHeaders: () => ({ Authorization: `Bearer ${accessToken}` }),
  },
});
const permissions = getAdminUiSdkPermissionClient({ httpClient });

// SPA bootstrap
const allowed = await permissions.check("Acme_Promotions::dashboard");
if (!allowed) {
  renderAccessDenied();
}

// Runtime action
export const handler = withAdminUiSdkPermission(
  "Acme_Promotions::edit",
  permissions,
  async (params) => {
    // Runs only if the current user has the resource granted.
    return { statusCode: 200, body: params };
  },
);
```

Call `permissions.invalidate(resource)` or `permissions.invalidate()` when permission grants change and cached results should be refreshed.

## Architecture

The library is built on top of [Ky](https://github.com/sindresorhus/ky), a modern HTTP client based on Fetch API, providing:

- Automatic retries with exponential backoff
- Request/response hooks
- Timeout support
- JSON parsing
- Error handling

The authentication layer integrates seamlessly with `@adobe/aio-commerce-lib-auth`, automatically handling:

- OAuth 1.0a signatures for PaaS instances
- Bearer token authentication for SaaS instances
- IMS token management and refresh

## Contributing

This package is part of the Adobe Commerce SDK monorepo. See the [Contributing Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/CONTRIBUTING.md) and [Development Guide](https://github.com/adobe/aio-commerce-sdk/blob/main/.github/DEVELOPMENT.md) for development setup and guidelines.

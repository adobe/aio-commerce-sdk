# API Documentation

## packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts

### Functions

#### `assertIntegrationAuthParams`

Asserts the provided configuration for an Adobe Commerce integration authentication provider. {@link IntegrationAuthParams}
{@link IntegrationAuthProvider}

**Parameters:**

- `config` - {Record<string, unknown>} The configuration to validate.

**Examples:**

````javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

// This will validate the config and throw if invalid
assertIntegrationAuthParams(config);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:61`


---

#### `getIntegrationAuthProvider`

Creates an {@link IntegrationAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - {IntegrationAuthParams} The configuration for the integration.

**Returns:** An {@link IntegrationAuthProvider} instance that can be used to get auth headers.

**Examples:**

```javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

const authProvider = getIntegrationAuthProvider(config);

// Get OAuth headers for a REST API call
const headers = authProvider.getHeaders("GET", "https://your-store.com/rest/V1/products");
console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }

// Can also be used with URL objects
const url = new URL("https://your-store.com/rest/V1/customers");
const postHeaders = authProvider.getHeaders("POST", url);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:99`


---

### Variables

#### `result`

Asserts the provided configuration for an Adobe Commerce integration authentication provider. {@link IntegrationAuthParams}
{@link IntegrationAuthProvider}

**Parameters:**

- `config` - {Record<string, unknown>} The configuration to validate.

**Examples:**

```javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

// This will validate the config and throw if invalid
assertIntegrationAuthParams(config);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:64`


---

#### `oauth`

Creates an {@link IntegrationAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - {IntegrationAuthParams} The configuration for the integration.

**Returns:** An {@link IntegrationAuthProvider} instance that can be used to get auth headers.

**Examples:**

```javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

const authProvider = getIntegrationAuthProvider(config);

// Get OAuth headers for a REST API call
const headers = authProvider.getHeaders("GET", "https://your-store.com/rest/V1/products");
console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }

// Can also be used with URL objects
const url = new URL("https://your-store.com/rest/V1/customers");
const postHeaders = authProvider.getHeaders("POST", url);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:102`


---

#### `oauthToken`

Creates an {@link IntegrationAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - {IntegrationAuthParams} The configuration for the integration.

**Returns:** An {@link IntegrationAuthProvider} instance that can be used to get auth headers.

**Examples:**

```javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

const authProvider = getIntegrationAuthProvider(config);

// Get OAuth headers for a REST API call
const headers = authProvider.getHeaders("GET", "https://your-store.com/rest/V1/products");
console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }

// Can also be used with URL objects
const url = new URL("https://your-store.com/rest/V1/customers");
const postHeaders = authProvider.getHeaders("POST", url);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:112`


---

#### `urlString`

Creates an {@link IntegrationAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - {IntegrationAuthParams} The configuration for the integration.

**Returns:** An {@link IntegrationAuthProvider} instance that can be used to get auth headers.

**Examples:**

```javascript
```typescript
const config = {
consumerKey: "your-consumer-key",
consumerSecret: "your-consumer-secret",
accessToken: "your-access-token",
accessTokenSecret: "your-access-token-secret"
};

const authProvider = getIntegrationAuthProvider(config);

// Get OAuth headers for a REST API call
const headers = authProvider.getHeaders("GET", "https://your-store.com/rest/V1/products");
console.log(headers); // { Authorization: "OAuth oauth_consumer_key=..., oauth_signature=..." }

// Can also be used with URL objects
const url = new URL("https://your-store.com/rest/V1/customers");
const postHeaders = authProvider.getHeaders("POST", url);
````

```

**Location:** `packages/aio-commerce-lib-auth/source/lib/integration-auth/provider.ts:119`


---

```

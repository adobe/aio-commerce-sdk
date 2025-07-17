# API Documentation

## packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts

### Functions

#### `snakeCaseImsAuthConfig`

Converts IMS auth configuration properties to snake_case format.

**Parameters:**

- `config` - The IMS auth configuration with camelCase properties.

**Returns:** The configuration with snake_case properties.

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:35`

---

#### `assertImsAuthParams`

Asserts the provided configuration for an Adobe IMS authentication provider. {@link ImsAuthParams}
{@link ImsAuthProvider}

**Parameters:**

- `config` - A record containing the configuration to validate.

**Examples:**

````javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod", // or "stage"
context: "my-app-context"
};

// This will validate the config and throw if invalid
assertImsAuthParams(config);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:70`


---

#### `getImsAuthProvider`

Creates an {@link ImsAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.

**Returns:** An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod",
context: "my-app-context"
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch('https://api.adobe.io/some-endpoint', {
headers: await authProvider.getHeaders()
});
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:121`


---

### Variables

#### `result`

Asserts the provided configuration for an Adobe IMS authentication provider. {@link ImsAuthParams}
{@link ImsAuthProvider}

**Parameters:**

- `config` - A record containing the configuration to validate.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod", // or "stage"
context: "my-app-context"
};

// This will validate the config and throw if invalid
assertImsAuthParams(config);
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:73`


---

#### `getAccessToken`

Creates an {@link ImsAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.

**Returns:** An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod",
context: "my-app-context"
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch('https://api.adobe.io/some-endpoint', {
headers: await authProvider.getHeaders()
});
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:122`


---

#### `snakeCasedConfig`

Creates an {@link ImsAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.

**Returns:** An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod",
context: "my-app-context"
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch('https://api.adobe.io/some-endpoint', {
headers: await authProvider.getHeaders()
});
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:123`


---

#### `getHeaders`

Creates an {@link ImsAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.

**Returns:** An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod",
context: "my-app-context"
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch('https://api.adobe.io/some-endpoint', {
headers: await authProvider.getHeaders()
});
````

````

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:129`


---

#### `accessToken`

Creates an {@link ImsAuthProvider} based on the provided configuration.

**Parameters:**

- `config` - An {@link ImsAuthParams} parameter that contains the configuration for the IMS auth provider.

**Returns:** An {@link ImsAuthProvider} instance that can be used to get access token and auth headers.

**Examples:**

```javascript
```typescript
const config = {
clientId: "your-client-id",
clientSecrets: ["your-client-secret"],
technicalAccountId: "your-technical-account-id",
technicalAccountEmail: "your-account@example.com",
imsOrgId: "your-ims-org-id@AdobeOrg",
scopes: ["AdobeID", "openid"],
environment: "prod",
context: "my-app-context"
};

const authProvider = getImsAuthProvider(config);

// Get access token
const token = await authProvider.getAccessToken();
console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."

// Get headers for API requests
const headers = await authProvider.getHeaders();
console.log(headers);
// {
//   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
//   "x-api-key": "your-client-id"
// }

// Use headers in API calls
const response = await fetch('https://api.adobe.io/some-endpoint', {
headers: await authProvider.getHeaders()
});
````

```

**Location:** `packages/aio-commerce-lib-auth/source/lib/ims-auth/provider.ts:130`


---

```

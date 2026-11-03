# `resolveAuthParams()`

```ts
function resolveAuthParams(params: Record<string, unknown>):
  | {
      clientId: string;
      clientSecrets: string[];
      context?: string;
      environment?: "prod" | "stage";
      imsOrgId: string;
      scopes: string[];
      strategy: "ims";
      technicalAccountEmail?: string;
      technicalAccountId?: string;
    }
  | {
      accessToken: string;
      accessTokenSecret: string;
      consumerKey: string;
      consumerSecret: string;
      strategy: "integration";
    };
```

Defined in: [utils.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-auth/source/lib/utils.ts#L55)

Automatically detects and resolves authentication parameters from App Builder action inputs.
Attempts to resolve IMS authentication first, then falls back to Integration authentication.

For OAuth Server-to-Server credentials, use the `include-ims-credentials` action annotation.
The legacy fallback to manually-wired `AIO_COMMERCE_AUTH_IMS_*` params in
[resolveImsAuthParams](resolveImsAuthParams.md) is deprecated and will be removed in a future major release.
Manually configured Commerce Integration credentials are unaffected.

## Parameters

| Parameter | Type                            | Description                                                         |
| --------- | ------------------------------- | ------------------------------------------------------------------- |
| `params`  | `Record`\<`string`, `unknown`\> | The App Builder action inputs containing authentication parameters. |

## Returns

\| \{
`clientId`: `string`;
`clientSecrets`: `string`[];
`context?`: `string`;
`environment?`: `"prod"` \| `"stage"`;
`imsOrgId`: `string`;
`scopes`: `string`[];
`strategy`: `"ims"`;
`technicalAccountEmail?`: `string`;
`technicalAccountId?`: `string`;
\}
\| \{
`accessToken`: `string`;
`accessTokenSecret`: `string`;
`consumerKey`: `string`;
`consumerSecret`: `string`;
`strategy`: `"integration"`;
\}

## Throws

If the parameters are invalid.

## Throws

If neither IMS nor Integration authentication parameters can be resolved.

## Example

```typescript
// Automatic detection (will use IMS if IMS params are present, otherwise Integration)
export function main(params) {
  const authProvider = resolveAuthParams(params);
  console.log(authProvider.strategy); // "ims" or "integration"
}
```

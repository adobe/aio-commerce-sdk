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
      technicalAccountEmail: string;
      technicalAccountId: string;
    }
  | {
      accessToken: string;
      accessTokenSecret: string;
      consumerKey: string;
      consumerSecret: string;
      strategy: "integration";
    };
```

Defined in: [utils.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-auth/source/lib/utils.ts#L50)

Automatically detects and resolves authentication parameters from App Builder action inputs.
Attempts to resolve IMS authentication first, then falls back to Integration authentication.

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
`technicalAccountEmail`: `string`;
`technicalAccountId`: `string`;
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

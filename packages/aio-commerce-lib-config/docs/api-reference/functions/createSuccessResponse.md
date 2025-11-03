# `createSuccessResponse()`

```ts
function createSuccessResponse<T>(
  statusCode: number,
  data: T,
  headers?: Record<string, string>,
): StandardActionResponse<T>;
```

Defined in: [utils/api-interface.ts:58](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L58)

Creates a standardized success response for runtime actions

## Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Parameters

| Parameter    | Type                           | Description                      |
| ------------ | ------------------------------ | -------------------------------- |
| `statusCode` | `number`                       | HTTP status code (typically 200) |
| `data`       | `T`                            | Response data                    |
| `headers?`   | `Record`\<`string`, `string`\> | Optional response headers        |

## Returns

[`StandardActionResponse`](../interfaces/StandardActionResponse.md)\<`T`\>

Standardized action success response

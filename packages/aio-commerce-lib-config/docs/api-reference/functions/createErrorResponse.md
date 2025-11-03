# `createErrorResponse()`

```ts
function createErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: string,
): StandardActionResponse;
```

Defined in: [utils/api-interface.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/752f0ed899598bcf6504a5b844c4c482176eabad/packages/aio-commerce-lib-config/source/utils/api-interface.ts#L33)

Creates a standardized error response for runtime actions

## Parameters

| Parameter    | Type     | Description                                 |
| ------------ | -------- | ------------------------------------------- |
| `statusCode` | `number` | HTTP status code                            |
| `code`       | `string` | Error code identifier                       |
| `message`    | `string` | Human-readable error message                |
| `details?`   | `string` | Optional additional details about the error |

## Returns

[`StandardActionResponse`](../interfaces/StandardActionResponse.md)

Standardized action error response

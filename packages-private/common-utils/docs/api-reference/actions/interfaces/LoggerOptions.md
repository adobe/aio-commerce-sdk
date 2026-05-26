# `LoggerOptions`

Defined in: [actions/http/middleware/logger.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/actions/http/middleware/logger.ts#L20)

## Extends

- `NonNullable`\<`AioLoggerOptions`\>

## Properties

### name?

```ts
optional name?: (ctx: BaseContext) => string;
```

Defined in: [actions/http/middleware/logger.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/actions/http/middleware/logger.ts#L21)

#### Parameters

| Parameter | Type                            |
| --------- | ------------------------------- |
| `ctx`     | [`BaseContext`](BaseContext.md) |

#### Returns

`string`

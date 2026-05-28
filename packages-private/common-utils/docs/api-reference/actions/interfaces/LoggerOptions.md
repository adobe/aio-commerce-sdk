# `LoggerOptions`

Defined in: [actions/http/middleware/logger.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages-private/common-utils/source/actions/http/middleware/logger.ts#L20)

## Extends

- `NonNullable`\<`AioLoggerOptions`\>

## Properties

### name?

```ts
optional name?: (ctx: BaseContext) => string;
```

Defined in: [actions/http/middleware/logger.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages-private/common-utils/source/actions/http/middleware/logger.ts#L21)

#### Parameters

| Parameter | Type                            |
| --------- | ------------------------------- |
| `ctx`     | [`BaseContext`](BaseContext.md) |

#### Returns

`string`

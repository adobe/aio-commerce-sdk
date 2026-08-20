# `LoggerOptions`

Defined in: [actions/http/middleware/logger.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/common-utils/source/actions/http/middleware/logger.ts#L20)

## Extends

- `NonNullable`\<`AioLoggerOptions`\>

## Properties

### name?

```ts
optional name?: (ctx: BaseContext) => string;
```

Defined in: [actions/http/middleware/logger.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/common-utils/source/actions/http/middleware/logger.ts#L21)

#### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `ctx`     | [`BaseContext`](../type-aliases/BaseContext.md) |

#### Returns

`string`

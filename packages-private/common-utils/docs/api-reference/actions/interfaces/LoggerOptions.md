# `LoggerOptions`

Defined in: [actions/http/middleware/logger.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/actions/http/middleware/logger.ts#L20)

## Extends

- `NonNullable`\<`AioLoggerOptions`\>

## Properties

### name?

```ts
name?: (ctx: BaseContext) => string;
```

Defined in: [actions/http/middleware/logger.ts:21](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/actions/http/middleware/logger.ts#L21)

#### Parameters

| Parameter | Type                                            |
| --------- | ----------------------------------------------- |
| `ctx`     | [`BaseContext`](../type-aliases/BaseContext.md) |

#### Returns

`string`

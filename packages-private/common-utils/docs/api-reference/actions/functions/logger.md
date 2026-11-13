# `logger()`

```ts
function logger(
  __namedParameters?: LoggerOptions,
): ContextBuilder<BaseContext, LoggerContext>;
```

Defined in: [actions/http/middleware/logger.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/middleware/logger.ts#L43)

Creates a logger middleware that adds logging capabilities to the context.

## Parameters

| Parameter            | Type                                              |
| -------------------- | ------------------------------------------------- |
| `__namedParameters?` | [`LoggerOptions`](../interfaces/LoggerOptions.md) |

## Returns

[`ContextBuilder`](../type-aliases/ContextBuilder.md)\<[`BaseContext`](../type-aliases/BaseContext.md), [`LoggerContext`](../interfaces/LoggerContext.md)\>

## Example

```typescript
router.use(logger({ level: "debug", name: () => "my-logger-name" }));

router.get("/test", {
  handler: (req, ctx) => {
    ctx.logger.info("Hello world");
    return ok({ body: {} });
  },
});
```

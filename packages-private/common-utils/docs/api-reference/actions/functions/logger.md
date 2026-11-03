# `logger()`

```ts
function logger(
  __namedParameters?: LoggerOptions,
): ContextBuilder<BaseContext, LoggerContext>;
```

Defined in: [actions/http/middleware/logger.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/common-utils/source/actions/http/middleware/logger.ts#L43)

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

# `logger()`

```ts
function logger(
  __namedParameters?: LoggerOptions,
): ContextBuilder<BaseContext, LoggerContext>;
```

Defined in: [actions/http/middleware/logger.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/common-utils/source/actions/http/middleware/logger.ts#L43)

Creates a logger middleware that adds logging capabilities to the context.

## Parameters

| Parameter           | Type                                              |
| ------------------- | ------------------------------------------------- |
| `__namedParameters` | [`LoggerOptions`](../interfaces/LoggerOptions.md) |

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

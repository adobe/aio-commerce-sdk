# `RouteContext`

Defined in: [actions/http/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/common-utils/source/actions/http/types.ts#L37)

Base context interface for route handlers.
This interface can be extended via declaration merging to add custom context properties.

## Example

```typescript
// Extend the context in your application
declare module "@adobe/aio-commerce-lib-core/actions" {
  interface RouteContext {
    user: { id: string; name: string };
    logger: Logger;
  }
}
```

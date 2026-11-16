# `RouteContext`

Defined in: [actions/http/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/types.ts#L38)

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

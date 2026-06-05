# `RouteContext`

Defined in: [actions/http/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages-private/common-utils/source/actions/http/types.ts#L37)

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

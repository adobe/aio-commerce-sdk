# `RouteContext`

Defined in: [actions/http/types.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/common-utils/source/actions/http/types.ts#L38)

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

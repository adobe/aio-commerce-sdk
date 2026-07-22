# `useSharedContext()`

```ts
function useSharedContext(): Result<SharedContext>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/context/shared-context.tsx:67](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/context/shared-context.tsx#L67)

Returns the current Commerce shared context. The guest connection is already established by
the time this can be called (see SharedContextProvider).

This is a low-level escape hatch that exposes the raw `sharedContext` and `host` objects.
Prefer a purpose-built hook ([useCommerce](useCommerce.md), [useMassActionContext](useMassActionContext.md),
[useOrderViewButtonContext](useOrderViewButtonContext.md)) when one covers what you need.

## Returns

`Result`\<[`SharedContext`](../type-aliases/SharedContext.md)\>

## Example

```tsx
import { useSharedContext } from "@adobe/aio-commerce-lib-admin-ui/web";

function ImsTokenLabel() {
  const { data, error } = useSharedContext();
  if (error) return null;
  return <span>{data.sharedContext.get("imsToken")}</span>;
}
```

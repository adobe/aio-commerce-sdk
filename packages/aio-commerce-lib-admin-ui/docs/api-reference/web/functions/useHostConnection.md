# `useHostConnection()`

```ts
function useHostConnection(): ActionsResult<HostConnection>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-host-connection.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-host-connection.ts#L43)

Returns typed helpers for interacting with the Commerce Admin host.

## Returns

`ActionsResult`\<[`HostConnection`](../type-aliases/HostConnection.md)\>

## Example

```tsx
import { useHostConnection } from "@adobe/aio-commerce-lib-admin-ui/web";

function DoneButton() {
  const { actions, error } = useHostConnection();
  if (error) return null;
  return <button onClick={actions.close}>Done</button>;
}
```

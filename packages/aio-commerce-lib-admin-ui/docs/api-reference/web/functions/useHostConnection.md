# `useHostConnection()`

```ts
function useHostConnection(): ActionsResult<HostConnection>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-host-connection.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/hooks/use-host-connection.ts#L43)

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

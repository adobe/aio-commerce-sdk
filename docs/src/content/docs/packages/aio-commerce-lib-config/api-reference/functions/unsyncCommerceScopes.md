---
title: "unsyncCommerceScopes()"
editUrl: false
prev: false
next: false
---

```ts
function unsyncCommerceScopes(): Promise<{
  unsynced: boolean;
}>;
```

Defined in: [config-manager.ts:257](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/config-manager.ts#L257)

Removes the commerce scope from the persisted scope tree.

## Returns

`Promise`\<\{
`unsynced`: `boolean`;
\}\>

Promise resolving to an object with `unsynced` boolean indicating whether the
scope was found and removed, or `false` if it was already not present.

## Example

```typescript
import { unsyncCommerceScopes } from "@adobe/aio-commerce-lib-config";

const result = await unsyncCommerceScopes();
if (result.unsynced) {
  console.log("Commerce scope removed successfully");
} else {
  console.log("Commerce scope not found");
}
```

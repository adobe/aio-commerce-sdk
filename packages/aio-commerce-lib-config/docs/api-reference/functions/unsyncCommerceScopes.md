# `unsyncCommerceScopes()`

```ts
function unsyncCommerceScopes(): Promise<{
  unsynced: boolean;
}>;
```

Defined in: [config-manager.ts:255](https://github.com/adobe/aio-commerce-sdk/blob/0bace73ed392a7067f65f99af36a006b8accb94b/packages/aio-commerce-lib-config/source/config-manager.ts#L255)

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

# `unsyncCommerceScopes()`

```ts
function unsyncCommerceScopes(): Promise<boolean>;
```

Defined in: [aio-commerce-lib-config/source/config-manager.ts:268](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/config-manager.ts#L268)

Removes the commerce scope from the persisted scope tree.

## Returns

`Promise`\<`boolean`\>

Promise resolving to a boolean indicating whether the scope was found and removed,
or if it was already not present.

## Example

```typescript
import { unsyncCommerceScopes } from "@adobe/aio-commerce-lib-config";

try {
  const result = await unsyncCommerceScopes();

  if (result) {
    console.log("Commerce scope removed successfully");
  }
} catch (error) {
  console.error("Failed to unsync commerce scopes:", error);
}
```

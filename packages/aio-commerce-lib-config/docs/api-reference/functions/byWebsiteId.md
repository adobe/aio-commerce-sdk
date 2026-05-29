# `byWebsiteId()`

```ts
function byWebsiteId(commerceScopeId: number): SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:762](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-config/source/config-utils.ts#L762)

Creates a scope selector that identifies a website by its Commerce API ID.

Websites are returned by the Commerce REST endpoint `/V1/store/websites`. The
numeric ID is matched against the `commerce_id` of website-level scopes in
the scope tree.

## Parameters

| Parameter         | Type     | Description                                 |
| ----------------- | -------- | ------------------------------------------- |
| `commerceScopeId` | `number` | The Commerce API numeric ID of the website. |

## Returns

[`SelectorByCommerceScopeId`](../type-aliases/SelectorByCommerceScopeId.md)

A selector that identifies the website scope.

## Example

```typescript
import { getConfiguration, byWebsiteId } from "@adobe/aio-commerce-lib-config";

const config = await getConfiguration(byWebsiteId(1));
```

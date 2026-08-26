# `byWebsiteId()`

```ts
function byWebsiteId(commerceScopeId: number): SelectorByCommerceScopeId;
```

Defined in: [config-utils.ts:768](https://github.com/adobe/aio-commerce-sdk/blob/f3ea3a64ac59c978f28865274fa282ec991ea529/packages/aio-commerce-lib-config/source/config-utils.ts#L768)

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

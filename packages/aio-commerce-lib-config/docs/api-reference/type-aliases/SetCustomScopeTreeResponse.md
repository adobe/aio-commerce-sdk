# `SetCustomScopeTreeResponse`

```ts
type SetCustomScopeTreeResponse = {
  message: string;
  scopes: CustomScopeOutput[];
  timestamp: string;
};
```

Defined in: [types/api.ts:117](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L117)

Response type for setting custom scope tree.

## Properties

### message

```ts
message: string;
```

Defined in: [types/api.ts:119](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L119)

Success message.

---

### scopes

```ts
scopes: CustomScopeOutput[];
```

Defined in: [types/api.ts:123](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L123)

Array of created/updated custom scopes with assigned IDs.

---

### timestamp

```ts
timestamp: string;
```

Defined in: [types/api.ts:121](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L121)

ISO timestamp of when the custom scope tree was updated.

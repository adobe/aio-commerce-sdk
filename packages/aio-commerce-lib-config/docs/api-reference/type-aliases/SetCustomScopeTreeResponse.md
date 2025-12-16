# `SetCustomScopeTreeResponse`

```ts
type SetCustomScopeTreeResponse = {
  message: string;
  scopes: CustomScopeOutput[];
  timestamp: string;
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:122](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L122)

Response type for setting custom scope tree.

## Properties

### message

```ts
message: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L124)

Success message.

---

### scopes

```ts
scopes: CustomScopeOutput[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:128](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L128)

Array of created/updated custom scopes with assigned IDs.

---

### timestamp

```ts
timestamp: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:126](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L126)

ISO timestamp of when the custom scope tree was updated.

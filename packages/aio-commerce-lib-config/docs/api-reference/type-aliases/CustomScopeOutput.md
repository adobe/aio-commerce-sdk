# `CustomScopeOutput`

```ts
type CustomScopeOutput = {
  children?: CustomScopeOutput[];
  code: string;
  id: string;
  is_editable: boolean;
  is_final: boolean;
  label: string;
  level: string;
};
```

Defined in: [types/api.ts:129](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L129)

Output type for a custom scope definition (includes assigned ID).

## Properties

### children?

```ts
optional children: CustomScopeOutput[];
```

Defined in: [types/api.ts:143](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L143)

Optional child scopes for hierarchical structures.

---

### code

```ts
code: string;
```

Defined in: [types/api.ts:133](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L133)

Unique code identifier for the scope.

---

### id

```ts
id: string;
```

Defined in: [types/api.ts:131](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L131)

Assigned scope ID.

---

### is_editable

```ts
is_editable: boolean;
```

Defined in: [types/api.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L139)

Whether the scope configuration can be edited.

---

### is_final

```ts
is_final: boolean;
```

Defined in: [types/api.ts:141](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L141)

Whether this is a final (leaf) scope that cannot have children.

---

### label

```ts
label: string;
```

Defined in: [types/api.ts:135](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L135)

Human-readable label for the scope.

---

### level

```ts
level: string;
```

Defined in: [types/api.ts:137](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L137)

Scope level.

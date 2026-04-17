# `CustomScopeInput`

```ts
type CustomScopeInput = {
  children?: CustomScopeInput[];
  code: string;
  id?: string;
  is_editable: boolean;
  is_final: boolean;
  label: string;
  level?: string;
};
```

Defined in: [types/api.ts:97](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L97)

Input type for a custom scope definition.

## Properties

### children?

```ts
optional children: CustomScopeInput[];
```

Defined in: [types/api.ts:111](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L111)

Optional child scopes for hierarchical structures.

---

### code

```ts
code: string;
```

Defined in: [types/api.ts:101](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L101)

Unique code identifier for the scope.

---

### id?

```ts
optional id: string;
```

Defined in: [types/api.ts:99](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L99)

Optional scope ID. If not provided, a new scope will be created.

---

### is_editable

```ts
is_editable: boolean;
```

Defined in: [types/api.ts:107](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L107)

Whether the scope configuration can be edited.

---

### is_final

```ts
is_final: boolean;
```

Defined in: [types/api.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L109)

Whether this is a final (leaf) scope that cannot have children.

---

### label

```ts
label: string;
```

Defined in: [types/api.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L103)

Human-readable label for the scope.

---

### level?

```ts
optional level: string;
```

Defined in: [types/api.ts:105](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-config/source/types/api.ts#L105)

Optional level. Defaults to base level if not provided.

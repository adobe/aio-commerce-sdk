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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:102](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L102)

Input type for a custom scope definition.

## Properties

### children?

```ts
optional children: CustomScopeInput[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L116)

Optional child scopes for hierarchical structures.

---

### code

```ts
code: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:106](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L106)

Unique code identifier for the scope.

---

### id?

```ts
optional id: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L104)

Optional scope ID. If not provided, a new scope will be created.

---

### is_editable

```ts
is_editable: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:112](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L112)

Whether the scope configuration can be edited.

---

### is_final

```ts
is_final: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:114](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L114)

Whether this is a final (leaf) scope that cannot have children.

---

### label

```ts
label: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L108)

Human-readable label for the scope.

---

### level?

```ts
optional level: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L110)

Optional level. Defaults to base level if not provided.

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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:134](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L134)

Output type for a custom scope definition (includes assigned ID).

## Properties

### children?

```ts
optional children: CustomScopeOutput[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:148](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L148)

Optional child scopes for hierarchical structures.

---

### code

```ts
code: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:138](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L138)

Unique code identifier for the scope.

---

### id

```ts
id: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:136](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L136)

Assigned scope ID.

---

### is_editable

```ts
is_editable: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:144](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L144)

Whether the scope configuration can be edited.

---

### is_final

```ts
is_final: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:146](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L146)

Whether this is a final (leaf) scope that cannot have children.

---

### label

```ts
label: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:140](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L140)

Human-readable label for the scope.

---

### level

```ts
level: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:142](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L142)

Scope level.

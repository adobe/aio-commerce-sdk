# `ScopeNode`

```ts
type ScopeNode = {
  children?: ScopeNode[];
  code: string;
  commerce_id?: number;
  id: string;
  is_editable: boolean;
  is_final: boolean;
  is_removable: boolean;
  label: string;
  level: string;
};
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:18](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L18)

Represents a single node in the scope tree hierarchy.

## Properties

### children?

```ts
optional children: ScopeNode[];
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L36)

Optional child scopes for hierarchical structures.

---

### code

```ts
code: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L22)

Unique code identifier for the scope.

---

### commerce_id?

```ts
optional commerce_id: number;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L34)

Optional Commerce API ID for system scopes.

---

### id

```ts
id: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L20)

Unique identifier for the scope.

---

### is_editable

```ts
is_editable: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L28)

Whether the scope configuration can be edited.

---

### is_final

```ts
is_final: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L30)

Whether this is a final (leaf) scope that cannot have children.

---

### is_removable

```ts
is_removable: boolean;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L32)

Whether the scope can be removed.

---

### label

```ts
label: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L24)

Human-readable label for the scope.

---

### level

```ts
level: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/modules/scope-tree/types.ts#L26)

The level of the scope (e.g., "global", "website", "store", "store_view").

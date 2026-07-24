# `StepStatus`

```ts
type StepStatus = {
  children: StepStatus[];
  id: string;
  meta: StepMetaInfo;
  name: string;
  path: string[];
  status: ExecutionStatus;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L46)

Status of a step in the installation tree.

## Properties

### children

```ts
children: StepStatus[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L63)

Child step statuses (empty for leaf steps).

---

### id

```ts
id: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L51)

Unique step identifier (e.g., UUID).

---

### meta

```ts
meta: StepMetaInfo;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L57)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L48)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L54)

Full path from root to this step.

---

### status

```ts
status: ExecutionStatus;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L60)

Current execution status.

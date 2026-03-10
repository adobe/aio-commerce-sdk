# `StepStatus`

```ts
type StepStatus = {
  children: StepStatus[];
  id: string;
  meta: StepMeta;
  name: string;
  path: string[];
  status: ExecutionStatus;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L45)

Status of a step in the installation tree.

## Properties

### children

```ts
children: StepStatus[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L62)

Child step statuses (empty for leaf steps).

---

### id

```ts
id: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L50)

Unique step identifier (e.g., UUID).

---

### meta

```ts
meta: StepMeta;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L56)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L47)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L53)

Full path from root to this step.

---

### status

```ts
status: ExecutionStatus;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L59)

Current execution status.

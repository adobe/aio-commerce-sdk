# `StepStatus`

```ts
type StepStatus = {
  children: StepStatus[];
  completedAt?: string;
  id: string;
  meta: StepMetaInfo;
  name: string;
  path: string[];
  startedAt?: string;
  status: ExecutionStatus;
};
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L39)

Status of a step in the workflow tree.

## Properties

### children

```ts
children: StepStatus[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L62)

Child step statuses (empty for leaf steps).

---

### completedAt?

```ts
completedAt?: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L59)

ISO timestamp when the step succeeded or failed.

---

### id

```ts
id: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L44)

Unique step identifier (e.g., UUID).

---

### meta

```ts
meta: StepMetaInfo;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L50)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L41)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L47)

Full path from root to this step.

---

### startedAt?

```ts
startedAt?: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L56)

ISO timestamp when the step started executing.

---

### status

```ts
status: ExecutionStatus;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L53)

Current execution status.

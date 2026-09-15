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

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L39)

Status of a step in the workflow tree.

## Properties

### children

```ts
children: StepStatus[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L56)

Child step statuses (empty for leaf steps).

---

### id

```ts
id: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L44)

Unique step identifier (e.g., UUID).

---

### meta

```ts
meta: StepMetaInfo;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L50)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L41)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L47)

Full path from root to this step.

---

### status

```ts
status: ExecutionStatus;
```

Defined in: [aio-commerce-lib-app/source/management/common/workflow/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-app/source/management/common/workflow/types.ts#L53)

Current execution status.

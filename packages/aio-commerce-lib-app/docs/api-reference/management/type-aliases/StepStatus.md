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

Defined in: [management/installation/workflow/types.ts:45](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L45)

Status of a step in the installation tree.

## Properties

### children

```ts
children: StepStatus[];
```

Defined in: [management/installation/workflow/types.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L62)

Child step statuses (empty for leaf steps).

---

### id

```ts
id: string;
```

Defined in: [management/installation/workflow/types.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L50)

Unique step identifier (e.g., UUID).

---

### meta

```ts
meta: StepMeta;
```

Defined in: [management/installation/workflow/types.ts:56](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L56)

Step metadata (for display purposes).

---

### name

```ts
name: string;
```

Defined in: [management/installation/workflow/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L47)

Step name (unique among siblings).

---

### path

```ts
path: string[];
```

Defined in: [management/installation/workflow/types.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L53)

Full path from root to this step.

---

### status

```ts
status: ExecutionStatus;
```

Defined in: [management/installation/workflow/types.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L59)

Current execution status.

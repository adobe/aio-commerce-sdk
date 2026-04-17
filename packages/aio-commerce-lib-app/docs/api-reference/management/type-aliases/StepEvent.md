# `StepEvent`

```ts
type StepEvent = {
  isLeaf: boolean;
  path: string[];
  stepName: string;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L25)

Base event payload for step events.

## Properties

### isLeaf

```ts
isLeaf: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L33)

Whether this is a leaf step (executable) or branch step (container).

---

### path

```ts
path: string[];
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L27)

Full path to the step (e.g., ["eventing", "commerce", "providers"]).

---

### stepName

```ts
stepName: string;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/hooks.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-app/source/management/installation/workflow/hooks.ts#L30)

Step name (last element of path, for convenience).

---
title: "initialize()"
editUrl: false
prev: false
next: false
---

```ts
function initialize(options: InitializeOptions): void;
```

Defined in: [config-manager.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-config/source/config-manager.ts#L59)

Initializes the configuration library so that it works as expected.
The schema is stored in global memory. If a schema is provided, it will be set.
If no schema is provided, initialization will succeed only if a schema was previously set globally.

## Parameters

| Parameter | Type                                                        | Description                                         |
| --------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `options` | [`InitializeOptions`](../type-aliases/InitializeOptions.md) | Options for initializing the configuration library. |

## Returns

`void`

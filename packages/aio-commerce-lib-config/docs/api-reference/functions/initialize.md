# `initialize()`

```ts
function initialize(options: InitializeOptions): void;
```

Defined in: [config-manager.ts:59](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-config/source/config-manager.ts#L59)

Initializes the configuration library so that it works as expected.
The schema is stored in global memory. If a schema is provided, it will be set.
If no schema is provided, initialization will succeed only if a schema was previously set globally.

## Parameters

| Parameter | Type                                                        | Description                                         |
| --------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `options` | [`InitializeOptions`](../type-aliases/InitializeOptions.md) | Options for initializing the configuration library. |

## Returns

`void`

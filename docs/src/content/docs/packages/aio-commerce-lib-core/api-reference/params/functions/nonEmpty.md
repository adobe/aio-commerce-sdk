---
title: "nonEmpty()"
editUrl: false
prev: false
next: false
---

```ts
function nonEmpty(name: string, value: unknown): boolean;
```

Defined in: [params/helpers.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/a9772d73e07fa247261408a7cf3d1aa439075a5e/packages/aio-commerce-lib-core/source/params/helpers.ts#L19)

Checks if the given runtime action input value is non-empty.

## Parameters

| Parameter | Type      | Description                                                                                                                                                                |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`  | The name of the parameter. Required because of `aio app dev` compatibility: inputs mapped to undefined env vars come as $<input_name> in dev mode, but as '' in prod mode. |
| `value`   | `unknown` | The value of the parameter.                                                                                                                                                |

## Returns

`boolean`

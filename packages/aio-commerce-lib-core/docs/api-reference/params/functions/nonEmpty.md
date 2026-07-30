# `nonEmpty()`

```ts
function nonEmpty(name: string, value: unknown): boolean;
```

Defined in: [params/helpers.ts:19](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-core/source/params/helpers.ts#L19)

Checks if the given runtime action input value is non-empty.

## Parameters

| Parameter | Type      | Description                                                                                                                                                                |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | `string`  | The name of the parameter. Required because of `aio app dev` compatibility: inputs mapped to undefined env vars come as $<input_name> in dev mode, but as '' in prod mode. |
| `value`   | `unknown` | The value of the parameter.                                                                                                                                                |

## Returns

`boolean`

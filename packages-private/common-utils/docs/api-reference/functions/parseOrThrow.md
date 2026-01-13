# `parseOrThrow()`

```ts
function parseOrThrow<TSchema>(
  schema: TSchema,
  input: unknown,
): InferOutput<TSchema>;
```

Defined in: [utils.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/40d6fd5f58ebb472ce181a467010903a429e0e2a/packages-private/common-utils/source/valibot/utils.ts#L23)

Parses the input using the provided schema and throws a CommerceSdkValidationError error if the input is invalid.

## Type Parameters

| Type Parameter                                                                     |
| ---------------------------------------------------------------------------------- |
| `TSchema` _extends_ `BaseSchema`\<`unknown`, `unknown`, `BaseIssue`\<`unknown`\>\> |

## Parameters

| Parameter | Type      | Description                    |
| --------- | --------- | ------------------------------ |
| `schema`  | `TSchema` | The schema to use for parsing. |
| `input`   | `unknown` | The input to parse.            |

## Returns

`InferOutput`\<`TSchema`\>

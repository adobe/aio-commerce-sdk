# `parseOrThrow()`

```ts
function parseOrThrow<TSchema>(
  schema: TSchema,
  input: unknown,
  message?: string,
): InferOutput<TSchema>;
```

Defined in: [utils.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages-private/common-utils/source/valibot/utils.ts#L24)

Parses the input using the provided schema and throws a CommerceSdkValidationError error if the input is invalid.

## Type Parameters

| Type Parameter                                                                     |
| ---------------------------------------------------------------------------------- |
| `TSchema` _extends_ `BaseSchema`\<`unknown`, `unknown`, `BaseIssue`\<`unknown`\>\> |

## Parameters

| Parameter  | Type      | Description                                             |
| ---------- | --------- | ------------------------------------------------------- |
| `schema`   | `TSchema` | The schema to use for parsing.                          |
| `input`    | `unknown` | The input to parse.                                     |
| `message?` | `string`  | Optional custom error message for the validation error. |

## Returns

`InferOutput`\<`TSchema`\>

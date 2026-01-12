# `alphaNumericOrUnderscoreSchema()`

```ts
function alphaNumericOrUnderscoreSchema(
  name: string,
): SchemaWithPipe<
  readonly [
    StringSchema<`Expected a string value for property '${string}'`>,
    RegexAction<
      string,
      `Only alphanumeric characters and underscores are allowed for "${string}"`
    >,
  ]
>;
```

Defined in: [schemas.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/40d6fd5f58ebb472ce181a467010903a429e0e2a/packages-private/common-utils/source/valibot/schemas.ts#L29)

A schema for a string that only contains alphanumeric characters and underscores.

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `name`    | `string` |

## Returns

`SchemaWithPipe`\<readonly \[`StringSchema`\<`` `Expected a string value for property '${string}'` ``\>, `RegexAction`\<`string`, `` `Only alphanumeric characters and underscores are allowed for "${string}"` ``\>\]\>

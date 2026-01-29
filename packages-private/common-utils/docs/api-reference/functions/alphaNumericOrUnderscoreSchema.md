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

Defined in: [schemas.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages-private/common-utils/source/valibot/schemas.ts#L29)

A schema for a string that only contains alphanumeric characters and underscores.

## Parameters

| Parameter | Type     |
| --------- | -------- |
| `name`    | `string` |

## Returns

`SchemaWithPipe`\<readonly \[`StringSchema`\<`` `Expected a string value for property '${string}'` ``\>, `RegexAction`\<`string`, `` `Only alphanumeric characters and underscores are allowed for "${string}"` ``\>\]\>

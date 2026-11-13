# `stringifyError()`

```ts
function stringifyError(error: unknown): string;
```

Defined in: [error/stringify-error.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages/aio-commerce-lib-core/source/error/stringify-error.ts#L30)

Converts any thrown value to a human-friendly string.

Validation errors use their formatted `display()` output, other errors use their message, and any other value goes through `String()`.

## Parameters

| Parameter | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| `error`   | `unknown` | The thrown value to convert. |

## Returns

`string`

## Example

```typescript
try {
  await doSomething();
} catch (error) {
  console.error(stringifyError(error));
}
```

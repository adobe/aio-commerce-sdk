# `setNodeEnv()`

```ts
function setNodeEnv(
  mode: "development" | "production",
  projectRoot: string,
): void;
```

Defined in: [env.ts:87](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/env.ts#L87)

Sets the `NODE_ENV` environment variable in the app `.env` file, so the web
bundler (Parcel) ships the matching React build. Creates the `.env` if absent.

## Parameters

| Parameter     | Type                              | Description                                       |
| ------------- | --------------------------------- | ------------------------------------------------- |
| `mode`        | `"development"` \| `"production"` | The environment mode to write into `NODE_ENV`.    |
| `projectRoot` | `string`                          | Resolved project root containing the `.env` file. |

## Returns

`void`

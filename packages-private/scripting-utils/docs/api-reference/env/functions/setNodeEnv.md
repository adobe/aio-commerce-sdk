# `setNodeEnv()`

```ts
function setNodeEnv(
  mode: "development" | "production",
  cwd?: string,
): Promise<void>;
```

Defined in: [env.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages-private/scripting-utils/source/env.ts#L100)

Sets the `NODE_ENV` environment variable in the app `.env` file, so the web
bundler (Parcel) ships the matching React build. Creates the `.env` if absent.

## Parameters

| Parameter | Type                              | Description                                                                |
| --------- | --------------------------------- | -------------------------------------------------------------------------- |
| `mode`    | `"development"` \| `"production"` | The environment mode to write into `NODE_ENV`.                             |
| `cwd`     | `string`                          | A directory within the project. Defaults to the current working directory. |

## Returns

`Promise`\<`void`\>

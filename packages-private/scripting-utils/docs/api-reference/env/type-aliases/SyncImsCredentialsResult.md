# `SyncImsCredentialsResult`

```ts
type SyncImsCredentialsResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "missing-env" | "no-ims-context";
    };
```

Defined in: [env.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages-private/scripting-utils/source/env.ts#L108)

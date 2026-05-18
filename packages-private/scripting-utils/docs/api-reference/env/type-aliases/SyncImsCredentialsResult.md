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

Defined in: [env.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages-private/scripting-utils/source/env.ts#L109)

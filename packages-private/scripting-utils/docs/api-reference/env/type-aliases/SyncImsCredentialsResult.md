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

Defined in: [env.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/scripting-utils/source/env.ts#L116)

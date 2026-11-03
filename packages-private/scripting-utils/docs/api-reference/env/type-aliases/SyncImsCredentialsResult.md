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

Defined in: [env.ts:116](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/env.ts#L116)

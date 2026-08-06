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

Defined in: [env.ts:108](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/env.ts#L108)

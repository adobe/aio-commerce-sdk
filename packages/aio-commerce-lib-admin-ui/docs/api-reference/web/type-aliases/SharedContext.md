# `SharedContext`

```ts
type SharedContext = {
  extensionId: string;
  host: NonNullable<GuestConnection["host"]>;
  sharedContext: NonNullable<GuestConnection["sharedContext"]>;
};
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L35)

The Commerce shared context for a mounted Admin UI iframe app.

This only exists when the app runs inside the Commerce Admin: it is provided by the Commerce UIX
host over the guest connection. It is distinct from the IMS credentials ([ImsContext](ImsContext.md)),
which are also available in the Experience Cloud shell.

## Properties

### extensionId

```ts
extensionId: string;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L37)

The extension ID of the app.

---

### host

```ts
host: NonNullable<GuestConnection["host"]>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L43)

The host proxy, used by `useHostConnection` to invoke host-frame actions (close/onError).

---

### sharedContext

```ts
sharedContext: NonNullable<GuestConnection["sharedContext"]>;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts:40](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/commerce/types.ts#L40)

The live `sharedContext` object provided by the host.

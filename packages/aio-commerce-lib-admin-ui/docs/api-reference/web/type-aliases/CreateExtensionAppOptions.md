# `CreateExtensionAppOptions`

```ts
type CreateExtensionAppOptions = {
  menu?: ReactNode;
  metadata: {
    extensionId: string;
  };
  root?: HTMLElement;
  routes?: ExtensionRoute[];
};
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:32](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L32)

Configuration options when instantiating an extension app.

## Properties

### menu?

```ts
optional menu?: ReactNode;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:40](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L40)

The optional app page opened from the Commerce Admin menu and by default in Experience Cloud Shell.

---

### metadata

```ts
metadata: {
  extensionId: string;
}
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:34](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L34)

General metadata about the extension app.

#### extensionId

```ts
extensionId: string;
```

The unique identifier for the extension app.

---

### root?

```ts
optional root?: HTMLElement;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:43](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L43)

Optional root element where the app will be mounted.

---

### routes?

```ts
optional routes?: ExtensionRoute[];
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:46](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L46)

Additional path-based routes for the extension app.

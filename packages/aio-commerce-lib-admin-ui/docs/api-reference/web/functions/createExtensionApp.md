# `createExtensionApp()`

```ts
function createExtensionApp(options: CreateExtensionAppOptions): void;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:70](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L70)

Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX
registration, shared-context attachment, routing, and Spectrum setup.

The app is wrapped in React's `<StrictMode>`, so in development builds (e.g. when
served via `aio app dev` or `aio app run`) components render twice and effects run
an extra setup + cleanup cycle on mount. Production builds are unaffected.

## Parameters

| Parameter | Type                                                                        | Description            |
| --------- | --------------------------------------------------------------------------- | ---------------------- |
| `options` | [`CreateExtensionAppOptions`](../type-aliases/CreateExtensionAppOptions.md) | App bootstrap options. |

## Returns

`void`

## Example

```tsx
import { createExtensionApp } from "@adobe/aio-commerce-lib-admin-ui/web";
import { MainPage } from "./pages/main-page.jsx";

createExtensionApp({
  metadata: { extensionId: "my-extension-id" },
  menu: <MainPage />,
});
```

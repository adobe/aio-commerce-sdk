# `createExtensionApp()`

```ts
function createExtensionApp(options: CreateExtensionAppOptions): void;
```

Defined in: [aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx:72](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-admin-ui/source/web/react/extension/create-app.tsx#L72)

Mounts a Commerce Admin UI iframe app and handles Experience Cloud Shell, UIX
registration, shared-context attachment, routing, and Spectrum setup.

The app is wrapped in React's `<StrictMode>` only in development builds
(`process.env.NODE_ENV !== "production"`), so components render twice and effects
run an extra setup + cleanup cycle on mount. Production builds
(`process.env.NODE_ENV === "production"`) render without `<StrictMode>`, so it is
stripped from the production bundle.

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

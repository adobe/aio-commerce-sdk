---
title: "CustomInstallationStepDefinition\\<TResult\\>"
editUrl: false
prev: false
next: false
---

```ts
type CustomInstallationStepDefinition<TResult> = {
  install: CustomInstallationStepHandler<TResult>;
  uninstall?: CustomInstallationStepHandler<void>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L33)

Object form for defining a custom installation step with both install and uninstall handlers.

## Type Parameters

| Type Parameter | Default type | Description                            |
| -------------- | ------------ | -------------------------------------- |
| `TResult`      | `unknown`    | The return type of the install handler |

## Properties

### install

```ts
install: CustomInstallationStepHandler<TResult>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L35)

The installation handler, called when the app is installed.

---

### uninstall?

```ts
optional uninstall?: CustomInstallationStepHandler<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L38)

The optional uninstall handler, called when the app is uninstalled.

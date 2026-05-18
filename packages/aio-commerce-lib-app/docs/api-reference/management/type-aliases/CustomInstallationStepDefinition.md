# `CustomInstallationStepDefinition\<TResult\>`

```ts
type CustomInstallationStepDefinition<TResult> = {
  install: CustomInstallationStepHandler<TResult>;
  uninstall?: CustomInstallationStepHandler<void>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L33)

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

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L35)

The installation handler, called when the app is installed.

---

### uninstall?

```ts
optional uninstall?: CustomInstallationStepHandler<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/a1c40b4c686e35858326a0a3cc4809a13e756e8b/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L38)

The optional uninstall handler, called when the app is uninstalled.

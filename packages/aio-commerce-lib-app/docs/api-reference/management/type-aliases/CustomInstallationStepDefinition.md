# `CustomInstallationStepDefinition\<TResult\>`

```ts
type CustomInstallationStepDefinition<TResult> = {
  install: CustomInstallationStepHandler<TResult>;
  uninstall?: CustomInstallationStepHandler<void>;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L33)

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

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L35)

The installation handler, called when the app is installed.

---

### uninstall?

```ts
optional uninstall?: CustomInstallationStepHandler<void>;
```

Defined in: [aio-commerce-lib-app/source/management/installation/custom-installation/define.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/custom-installation/define.ts#L38)

The optional uninstall handler, called when the app is uninstalled.

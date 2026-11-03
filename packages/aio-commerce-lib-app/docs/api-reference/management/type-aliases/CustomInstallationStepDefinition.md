# `CustomInstallationStepDefinition\<TResult = `unknown`\>`

```ts
type CustomInstallationStepDefinition<TResult = unknown> = {
  install: CustomInstallationStepHandler<TResult>;
  uninstall?: CustomInstallationStepHandler<void>;
};
```

Defined in: [aio-commerce-lib-app/source/management/domains/custom-installation/define.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/domains/custom-installation/define.ts#L33)

Object form for defining a custom installation step with both install and uninstall handlers.

## Type Parameters

| Type Parameter                                | Default type | Description                            |
| --------------------------------------------- | ------------ | -------------------------------------- |
| <a id="type-parameter-tresult"></a> `TResult` | `unknown`    | The return type of the install handler |

## Properties

### install

```ts
install: CustomInstallationStepHandler<TResult>;
```

Defined in: [aio-commerce-lib-app/source/management/domains/custom-installation/define.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/domains/custom-installation/define.ts#L35)

The installation handler, called when the app is installed.

---

### uninstall?

```ts
uninstall?: CustomInstallationStepHandler<void>;
```

Defined in: [aio-commerce-lib-app/source/management/domains/custom-installation/define.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-app/source/management/domains/custom-installation/define.ts#L38)

The optional uninstall handler, called when the app is uninstalled.

# `RunValidationOptions`

```ts
type RunValidationOptions = {
  config: CommerceAppConfigOutputModel;
  validationContext: ValidationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:175](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L175)

Options for running pre-installation validation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:180](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L180)

The app configuration.

---

### validationContext

```ts
validationContext: ValidationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:177](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L177)

Validation context (params, logger, appData — no customScripts).

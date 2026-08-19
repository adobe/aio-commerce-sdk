# `RunValidationOptions`

```ts
type RunValidationOptions = {
  config: CommerceAppConfigOutputModel;
  validationContext: ValidationContext;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:175](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L175)

Options for running pre-installation validation.

## Properties

### config

```ts
config: CommerceAppConfigOutputModel;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:180](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L180)

The app configuration.

---

### validationContext

```ts
validationContext: ValidationContext;
```

Defined in: [aio-commerce-lib-app/source/management/installation/runner.ts:177](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/runner.ts#L177)

Validation context (params, logger, appData — no customScripts).

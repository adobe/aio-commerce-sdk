# `InstallationRetryMetadata`

```ts
type InstallationRetryMetadata = {
  isRetry: boolean;
};
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:98](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L98)

Metadata set when a retry was attempted, regardless of outcome.

## Properties

### isRetry

```ts
isRetry: boolean;
```

Defined in: [aio-commerce-lib-app/source/management/installation/workflow/types.ts:100](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/management/installation/workflow/types.ts#L100)

True when installation was attempted more than once.

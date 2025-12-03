# `SetConfigurationRequest`

```ts
type SetConfigurationRequest = {
  config: {
    name: string;
    value: AcceptableConfigValue;
  }[];
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/types/api.ts#L60)

Request type for setting configuration values.

## Properties

### config

```ts
config: {
  name: string;
  value: AcceptableConfigValue;
}
[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/types/api.ts#L62)

Array of configuration name-value pairs to set.

#### name

```ts
name: string;
```

The name of the configuration field.

#### value

```ts
value: AcceptableConfigValue;
```

The value to set (string, number, or boolean).

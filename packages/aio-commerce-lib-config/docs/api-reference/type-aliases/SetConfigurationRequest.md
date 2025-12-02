# `SetConfigurationRequest`

```ts
type SetConfigurationRequest = {
  config: {
    name: string;
    value: AcceptableConfigValue;
  }[];
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L60)

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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/types/api.ts#L62)

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

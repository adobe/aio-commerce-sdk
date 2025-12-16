# `SetConfigurationRequest`

```ts
type SetConfigurationRequest = {
  config: {
    name: string;
    value: BusinessConfigSchemaValue;
  }[];
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L60)

Request type for setting configuration values.

## Properties

### config

```ts
config: {
  name: string;
  value: BusinessConfigSchemaValue;
}
[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-config/source/types/api.ts#L62)

Array of configuration name-value pairs to set.

#### name

```ts
name: string;
```

The name of the configuration field.

#### value

```ts
value: BusinessConfigSchemaValue;
```

The value to set (string, number, or boolean).

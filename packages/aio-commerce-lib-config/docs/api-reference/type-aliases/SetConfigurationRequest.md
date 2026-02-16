# `SetConfigurationRequest`

```ts
type SetConfigurationRequest = {
  config: {
    name: string;
    value: BusinessConfigSchemaValue;
  }[];
};
```

Defined in: [aio-commerce-lib-config/source/types/api.ts:60](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/api.ts#L60)

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

Defined in: [aio-commerce-lib-config/source/types/api.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/types/api.ts#L62)

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

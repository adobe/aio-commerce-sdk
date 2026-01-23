# `SetConfigurationResponse`

```ts
type SetConfigurationResponse = {
  config: {
    name: string;
    value: BusinessConfigSchemaValue;
  }[];
  message: string;
  scope: {
    code: string;
    id: string;
    level: string;
  };
  timestamp: string;
};
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:73](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L73)

Response type for setting configuration values.

## Properties

### config

```ts
config: {
  name: string;
  value: BusinessConfigSchemaValue;
}
[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L85)

Array of updated configuration values.

#### name

```ts
name: string;
```

#### value

```ts
value: BusinessConfigSchemaValue;
```

---

### message

```ts
message: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:75](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L75)

Success message.

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:79](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L79)

Scope information including id, code, and level.

#### code

```ts
code: string;
```

#### id

```ts
id: string;
```

#### level

```ts
level: string;
```

---

### timestamp

```ts
timestamp: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:77](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/types/api.ts#L77)

ISO timestamp of when the configuration was updated.

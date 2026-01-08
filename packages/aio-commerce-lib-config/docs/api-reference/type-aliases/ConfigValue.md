# `ConfigValue`

```ts
type ConfigValue = {
  name: string;
  origin: ConfigOrigin;
  value: BusinessConfigSchemaValue;
};
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L29)

Represents a configuration value with its origin information.

## Properties

### name

```ts
name: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L31)

The name of the configuration field.

---

### origin

```ts
origin: ConfigOrigin;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L35)

The origin scope where this value was set or inherited from.

---

### value

```ts
value: BusinessConfigSchemaValue;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L33)

The configuration value (string, number, boolean, or undefined).

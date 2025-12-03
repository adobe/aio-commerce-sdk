# `ConfigValue`

```ts
type ConfigValue = {
  name: string;
  origin: ConfigOrigin;
  value: AcceptableConfigValue;
};
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L37)

Represents a configuration value with its origin information.

## Properties

### name

```ts
name: string;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:39](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L39)

The name of the configuration field.

---

### origin

```ts
origin: ConfigOrigin;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:43](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L43)

The origin scope where this value was set or inherited from.

---

### value

```ts
value: AcceptableConfigValue;
```

Defined in: [packages/aio-commerce-lib-config/source/modules/configuration/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-config/source/modules/configuration/types.ts#L41)

The configuration value (string, number, boolean, or undefined).

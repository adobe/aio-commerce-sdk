# `SetConfigurationResponse`

```ts
type SetConfigurationResponse = {
  config: {
    name: string;
    value: string | number | boolean;
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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/types/api.ts#L47)

## Properties

### config

```ts
config: {
  name: string;
  value: string | number | boolean;
}
[];
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/types/api.ts#L55)

#### name

```ts
name: string;
```

#### value

```ts
value: string | number | boolean;
```

---

### message

```ts
message: string;
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/types/api.ts#L48)

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/types/api.ts#L50)

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

Defined in: [packages/aio-commerce-lib-config/source/types/api.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/1660e782eb683cfc711de0cdc31ab1722ce9f118/packages/aio-commerce-lib-config/source/types/api.ts#L49)

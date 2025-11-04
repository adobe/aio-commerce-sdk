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

Defined in: [types/api.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/types/api.ts#L47)

## Properties

### config

```ts
config: {
  name: string;
  value: string | number | boolean;
}
[];
```

Defined in: [types/api.ts:55](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/types/api.ts#L55)

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

Defined in: [types/api.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/types/api.ts#L48)

---

### scope

```ts
scope: {
  code: string;
  id: string;
  level: string;
}
```

Defined in: [types/api.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/types/api.ts#L50)

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

Defined in: [types/api.ts:49](https://github.com/adobe/aio-commerce-sdk/blob/88c96db601b539591174d2688fb3767e977f3e86/packages/aio-commerce-lib-config/source/types/api.ts#L49)

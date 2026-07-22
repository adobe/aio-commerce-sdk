# `EventingSchema`

```ts
const EventingSchema: ObjectSchema<{
  commerce: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [ArraySchema<..., ...>, MinLengthAction<..., ..., ...>, CheckAction<..., ...>]>;
     provider: ObjectSchema<{
        description: SchemaWithPipe<...>;
        key: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
     }, undefined>;
   }, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
     events: {
        description: string;
        destination?: ... | ...;
        env?: ... | ...;
        fields: ...[];
        force?: ... | ... | ...;
        hipaa_audit_required?: ... | ... | ...;
        label: string;
        name: string;
        priority?: ... | ... | ...;
        rules?: ... | ...;
        runtimeActions: ...[];
     }[];
     provider: {
        description: string;
        key?: string;
        label: string;
     };
  }[], "Commerce provider labels must be unique">]>, undefined>;
  external: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: SchemaWithPipe<readonly [ArraySchema<..., ...>, MinLengthAction<..., ..., ...>, CheckAction<..., ...>]>;
     provider: ObjectSchema<{
        description: SchemaWithPipe<...>;
        key: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
     }, undefined>;
   }, undefined>, "Expected an array of external event sources">, CheckAction<{
     events: {
        description: string;
        env?: ... | ...;
        hipaa_audit_required?: ... | ... | ...;
        label: string;
        name: string;
        runtimeActions: ...[];
     }[];
     provider: {
        description: string;
        key?: string;
        label: string;
     };
  }[], "External provider labels must be unique">]>, undefined>;
}, undefined>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:285](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L285)

Schema for eventing configuration with separate commerce and external arrays

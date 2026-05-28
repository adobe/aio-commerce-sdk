# `EventingSchema`

```ts
const EventingSchema: ObjectSchema<{
  commerce: OptionalSchema<SchemaWithPipe<readonly [ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: ...;
        destination: ...;
        fields: ...;
        force: ...;
        hipaa_audit_required: ...;
        label: ...;
        name: ...;
        priority: ...;
        rules: ...;
        runtimeActions: ...;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<...>;
        key: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
     }, undefined>;
   }, undefined>, "Expected an array of Commerce event sources">, CheckAction<{
     events: {
        description: string;
        destination?: ... | ...;
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
     events: ArraySchema<ObjectSchema<{
        description: ...;
        label: ...;
        name: ...;
        runtimeActions: ...;
     }, undefined>, "Expected an array of external events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<...>;
        key: OptionalSchema<..., ...>;
        label: SchemaWithPipe<...>;
     }, undefined>;
   }, undefined>, "Expected an array of external event sources">, CheckAction<{
     events: {
        description: string;
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

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:263](https://github.com/adobe/aio-commerce-sdk/blob/40732fdfa3764f9a9793fdba8984c173c9e0ef32/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L263)

Schema for eventing configuration with separate commerce and external arrays

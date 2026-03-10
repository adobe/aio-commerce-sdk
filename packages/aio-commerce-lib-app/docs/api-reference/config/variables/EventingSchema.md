# `EventingSchema`

```ts
const EventingSchema: ObjectSchema<{
  commerce: OptionalSchema<ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ...]>;
        destination: OptionalSchema<SchemaWithPipe<...>, undefined>;
        fields: ArraySchema<ObjectSchema<..., ...>, "Expected an array of event field objects with a 'name' property">;
        force: OptionalSchema<BooleanSchema<...>, undefined>;
        hipaa_audit_required: OptionalSchema<BooleanSchema<...>, undefined>;
        label: SchemaWithPipe<readonly [..., ...]>;
        name: SchemaWithPipe<readonly [..., ..., ...]>;
        priority: OptionalSchema<BooleanSchema<...>, undefined>;
        rules: OptionalSchema<ArraySchema<..., ...>, undefined>;
        runtimeActions: ArraySchema<SchemaWithPipe<...>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of Commerce events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<...>, MaxLengthAction<..., ..., ...>]>;
        key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<...>, MaxLengthAction<..., ..., ...>]>;
     }, undefined>;
  }, undefined>, "Expected an array of Commerce event sources">, undefined>;
  external: OptionalSchema<ArraySchema<ObjectSchema<{
     events: ArraySchema<ObjectSchema<{
        description: SchemaWithPipe<readonly [..., ...]>;
        label: SchemaWithPipe<readonly [..., ...]>;
        name: SchemaWithPipe<readonly [..., ..., ...]>;
        runtimeActions: ArraySchema<SchemaWithPipe<...>, "Expected an array of runtime actions in the format <package>/<action>">;
     }, undefined>, "Expected an array of external events">;
     provider: ObjectSchema<{
        description: SchemaWithPipe<readonly [SchemaWithPipe<...>, MaxLengthAction<..., ..., ...>]>;
        key: OptionalSchema<SchemaWithPipe<readonly [..., ...]>, undefined>;
        label: SchemaWithPipe<readonly [SchemaWithPipe<...>, MaxLengthAction<..., ..., ...>]>;
     }, undefined>;
  }, undefined>, "Expected an array of external event sources">, undefined>;
}, undefined>;
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:235](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L235)

Schema for eventing configuration with separate commerce and external arrays

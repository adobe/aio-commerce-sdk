# `validateConfigDomain()`

```ts
function validateConfigDomain<T>(
  config: unknown,
  domain: T,
): NonNullable<
  Get<
    {
      businessConfig?: {
        schema: (
          | {
              default: string;
              description?: string;
              label?: string;
              name: string;
              options: {
                label: string;
                value: string;
              }[];
              selectionMode: "single";
              type: "list";
            }
          | {
              default: string[];
              description?: string;
              label?: string;
              name: string;
              options: {
                label: string;
                value: string;
              }[];
              selectionMode: "multiple";
              type: "list";
            }
          | {
              default?: string;
              description?: string;
              label?: string;
              name: string;
              type: "text";
            }
          | {
              default?: string;
              description?: string;
              label?: string;
              name: string;
              type: "email";
            }
          | {
              default?: string;
              description?: string;
              label?: string;
              name: string;
              type: "url";
            }
          | {
              default?: string;
              description?: string;
              label?: string;
              name: string;
              type: "tel";
            }
        )[];
      };
      metadata: {
        description: string;
        displayName: string;
        id: string;
        version: string;
      };
    },
    T
  >
>;
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/validate.ts:114](https://github.com/adobe/aio-commerce-sdk/blob/0a288d7c5e68ff4da901f82cbda502430799502f/packages/aio-commerce-lib-extensibility/source/config/lib/validate.ts#L114)

Validates a specific domain configuration within the extensibility config.

This function validates only a specific domain's configuration rather than
the entire extensibility configuration object. It first validates that the
domain name is valid, then validates the configuration data against the
schema for that specific domain.

## Type Parameters

| Type Parameter                                                                | Description                                                |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `T` _extends_ `"metadata"` \| `"businessConfig"` \| `"businessConfig.schema"` | The type of the domain, constrained to valid domain names. |

## Parameters

| Parameter | Type      | Description                                                         |
| --------- | --------- | ------------------------------------------------------------------- |
| `config`  | `unknown` | The domain configuration object to validate.                        |
| `domain`  | `T`       | The name of the domain to validate (e.g., 'businessConfiguration'). |

## Returns

`NonNullable`\<`Get`\<\{
`businessConfig?`: \{
`schema`: (
\| \{
`default`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: `string`;
`value`: `string`;
\}[];
`selectionMode`: `"single"`;
`type`: `"list"`;
\}
\| \{
`default`: `string`[];
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`options`: \{
`label`: `string`;
`value`: `string`;
\}[];
`selectionMode`: `"multiple"`;
`type`: `"list"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"text"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"email"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"url"`;
\}
\| \{
`default?`: `string`;
`description?`: `string`;
`label?`: `string`;
`name`: `string`;
`type`: `"tel"`;
\})[];
\};
`metadata`: \{
`description`: `string`;
`displayName`: `string`;
`id`: `string`;
`version`: `string`;
\};
\}, `T`\>\>

The validated and typed configuration for the specified domain.

## Throws

If the domain name is invalid or if the
configuration doesn't match the domain's schema.

## Example

```typescript
const businessConfig = {
  fields: [
    {
      name: "category",
      type: "dropdown",
      // ... field configuration
    },
  ],
};

try {
  const validatedConfig = validateConfigDomain(
    businessConfig,
    "businessConfig",
  );
  // Use validatedConfig safely
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    console.error("Domain validation failed:", error.issues);
  }
}
```

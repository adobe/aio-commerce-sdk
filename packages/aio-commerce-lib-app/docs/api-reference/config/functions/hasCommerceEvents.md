# `hasCommerceEvents()`

```ts
function hasCommerceEvents(config: {
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
        default?: undefined;
        description?: string;
        label?: string;
        name: string;
        type: "password";
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
     })[];
  };
  eventing?: {
     commerce?: {
        events: {
           description: string;
           destination?: string;
           fields: {
              name: ...;
              source?: ...;
           }[];
           force?: boolean;
           hipaa_audit_required?: boolean;
           label: string;
           name: string;
           priority?: boolean;
           rules?: ...[];
           runtimeActions: string[];
        }[];
        provider: {
           description: string;
           key?: string;
           label: string;
        };
     }[];
     external?: {
        events: {
           description: string;
           label: string;
           name: string;
           runtimeActions: string[];
        }[];
        provider: {
           description: string;
           key?: string;
           label: string;
        };
     }[];
  };
  installation?: {
     customInstallationSteps?: {
        description: string;
        name: string;
        script: string;
     }[];
     messages?: {
        postInstallation?: string;
        preInstallation?: string;
     };
  };
  metadata: {
     description: string;
     displayName: string;
     id: string;
     version: string;
  };
} & {
[key: string]: unknown;
}): config is { businessConfig?: { schema: ({ default: string; description?: string; label?: string; name: string; options: { label: string; value: string }[]; selectionMode: "single"; type: "list" } | { default: string[]; description?: string; label?: string; name: string; options: { label: string; value: string }[]; selectionMode: "multiple"; type: "list" } | { default?: string; description?: string; label?: string; name: string; type: "text" } | { default?: undefined; description?: string; label?: string; name: string; type: "password" } | { default?: string; description?: string; label?: string; name: string; type: "email" } | { default?: string; description?: string; label?: string; name: string; type: "url" } | { default?: string; description?: string; label?: string; name: string; type: "tel" })[] }; eventing: { commerce: { events: { description: string; destination?: string; fields: { name: string; source?: string }[]; force?: boolean; hipaa_audit_required?: boolean; label: string; name: string; priority?: boolean; rules?: { field: string; operator: "regex" | "greaterThan" | "lessThan" | "equal" | "in" | "onChange"; value: string }[]; runtimeActions: string[] }[]; provider: { description: string; key?: string; label: string } }[]; external?: { events: { description: string; label: string; name: string; runtimeActions: string[] }[]; provider: { description: string; key?: string; label: string } }[] }; installation?: { customInstallationSteps?: { description: string; name: string; script: string }[]; messages?: { postInstallation?: string; preInstallation?: string } }; metadata: { description: string; displayName: string; id: string; version: string }; [key: string]: {} };
```

Defined in: [aio-commerce-lib-app/source/config/schema/eventing.ts:297](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L297)

Check if config has commerce event sources.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`  | \{ `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `undefined`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: `string`; `destination?`: `string`; `fields`: \{ `name`: ...; `source?`: ...; \}[]; `force?`: `boolean`; `hipaa_audit_required?`: `boolean`; `label`: `string`; `name`: `string`; `priority?`: `boolean`; `rules?`: ...[]; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: `string`; `label`: `string`; `name`: `string`; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; \} & \{ \[`key`: `string`\]: `unknown`; \} | The configuration to check. |

## Returns

config is \{ businessConfig?: \{ schema: (\{ default: string; description?: string; label?: string; name: string; options: \{ label: string; value: string \}\[\]; selectionMode: "single"; type: "list" \} \| \{ default: string\[\]; description?: string; label?: string; name: string; options: \{ label: string; value: string \}\[\]; selectionMode: "multiple"; type: "list" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "text" \} \| \{ default?: undefined; description?: string; label?: string; name: string; type: "password" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "email" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "url" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "tel" \})\[\] \}; eventing: \{ commerce: \{ events: \{ description: string; destination?: string; fields: \{ name: string; source?: string \}\[\]; force?: boolean; hipaa_audit_required?: boolean; label: string; name: string; priority?: boolean; rules?: \{ field: string; operator: "regex" \| "greaterThan" \| "lessThan" \| "equal" \| "in" \| "onChange"; value: string \}\[\]; runtimeActions: string\[\] \}\[\]; provider: \{ description: string; key?: string; label: string \} \}\[\]; external?: \{ events: \{ description: string; label: string; name: string; runtimeActions: string\[\] \}\[\]; provider: \{ description: string; key?: string; label: string \} \}\[\] \}; installation?: \{ customInstallationSteps?: \{ description: string; name: string; script: string \}\[\]; messages?: \{ postInstallation?: string; preInstallation?: string \} \}; metadata: \{ description: string; displayName: string; id: string; version: string \}; \[key: string\]: \{\} \}

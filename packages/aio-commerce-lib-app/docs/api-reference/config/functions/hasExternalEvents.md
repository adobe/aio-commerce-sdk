# `hasExternalEvents()`

```ts
function hasExternalEvents(config: {
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
           hipaaAuditRequired?: boolean;
           label: string;
           name: string;
           prioritary?: boolean;
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
}): config is { businessConfig?: { schema: ({ default: string; description?: string; label?: string; name: string; options: { label: string; value: string }[]; selectionMode: "single"; type: "list" } | { default: string[]; description?: string; label?: string; name: string; options: { label: string; value: string }[]; selectionMode: "multiple"; type: "list" } | { default?: string; description?: string; label?: string; name: string; type: "text" } | { default?: string; description?: string; label?: string; name: string; type: "password" } | { default?: string; description?: string; label?: string; name: string; type: "email" } | { default?: string; description?: string; label?: string; name: string; type: "url" } | { default?: string; description?: string; label?: string; name: string; type: "tel" })[] }; eventing: { commerce?: { events: { description: string; destination?: string; fields: { name: string; source?: string }[]; force?: boolean; hipaaAuditRequired?: boolean; label: string; name: string; prioritary?: boolean; rules?: { field: string; operator: (...) | (...) | (...) | (...) | (...) | (...); value: string }[]; runtimeActions: string[] }[]; provider: { description: string; key?: string; label: string } }[]; external: { events: { description: string; label: string; name: string; runtimeActions: string[] }[]; provider: { description: string; key?: string; label: string } }[] }; installation?: { customInstallationSteps?: { description: string; name: string; script: string }[]; messages?: { postInstallation?: string; preInstallation?: string } }; metadata: { description: string; displayName: string; id: string; version: string }; [key: string]: {} };
```

Defined in: [config/schema/eventing.ts:280](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-app/source/config/schema/eventing.ts#L280)

Check if config has external event sources.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Description                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `config`  | \{ `businessConfig?`: \{ `schema`: ( \| \{ `default`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"single"`; `type`: `"list"`; \} \| \{ `default`: `string`[]; `description?`: `string`; `label?`: `string`; `name`: `string`; `options`: \{ `label`: `string`; `value`: `string`; \}[]; `selectionMode`: `"multiple"`; `type`: `"list"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"text"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"password"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"email"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"url"`; \} \| \{ `default?`: `string`; `description?`: `string`; `label?`: `string`; `name`: `string`; `type`: `"tel"`; \})[]; \}; `eventing?`: \{ `commerce?`: \{ `events`: \{ `description`: `string`; `destination?`: `string`; `fields`: \{ `name`: ...; `source?`: ...; \}[]; `force?`: `boolean`; `hipaaAuditRequired?`: `boolean`; `label`: `string`; `name`: `string`; `prioritary?`: `boolean`; `rules?`: ...[]; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; `external?`: \{ `events`: \{ `description`: `string`; `label`: `string`; `name`: `string`; `runtimeActions`: `string`[]; \}[]; `provider`: \{ `description`: `string`; `key?`: `string`; `label`: `string`; \}; \}[]; \}; `installation?`: \{ `customInstallationSteps?`: \{ `description`: `string`; `name`: `string`; `script`: `string`; \}[]; `messages?`: \{ `postInstallation?`: `string`; `preInstallation?`: `string`; \}; \}; `metadata`: \{ `description`: `string`; `displayName`: `string`; `id`: `string`; `version`: `string`; \}; \} & \{ \[`key`: `string`\]: `unknown`; \} | The configuration to check. |

## Returns

config is \{ businessConfig?: \{ schema: (\{ default: string; description?: string; label?: string; name: string; options: \{ label: string; value: string \}\[\]; selectionMode: "single"; type: "list" \} \| \{ default: string\[\]; description?: string; label?: string; name: string; options: \{ label: string; value: string \}\[\]; selectionMode: "multiple"; type: "list" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "text" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "password" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "email" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "url" \} \| \{ default?: string; description?: string; label?: string; name: string; type: "tel" \})\[\] \}; eventing: \{ commerce?: \{ events: \{ description: string; destination?: string; fields: \{ name: string; source?: string \}\[\]; force?: boolean; hipaaAuditRequired?: boolean; label: string; name: string; prioritary?: boolean; rules?: \{ field: string; operator: (...) \| (...) \| (...) \| (...) \| (...) \| (...); value: string \}\[\]; runtimeActions: string\[\] \}\[\]; provider: \{ description: string; key?: string; label: string \} \}\[\]; external: \{ events: \{ description: string; label: string; name: string; runtimeActions: string\[\] \}\[\]; provider: \{ description: string; key?: string; label: string \} \}\[\] \}; installation?: \{ customInstallationSteps?: \{ description: string; name: string; script: string \}\[\]; messages?: \{ postInstallation?: string; preInstallation?: string \} \}; metadata: \{ description: string; displayName: string; id: string; version: string \}; \[key: string\]: \{\} \}

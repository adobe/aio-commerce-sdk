# Dynamic list options

- **Ticket:** [CEXT-6077](https://jira.corp.adobe.com/browse/CEXT-6077)
- **Created:** 2026-05-07
- [ ] **Implemented**

## Summary

Extend the existing `list` field type in business configuration schemas to accept a factory
function for `options`, enabling app developers to populate select dropdowns with values fetched
from external APIs (such as payment methods or store views available in a specific merchant's
Commerce installation). The `list` type continues to accept static option arrays; a new
`MaybeDynamic` type layer in `lib-config` distinguishes definition-time schemas (which may contain
factories) from resolved schemas (which always contain concrete arrays).

## Motivation

The business configuration schema lets Commerce app developers declare the fields a merchant must
fill in before the app is usable. One of those field types, `list`, presents the merchant with a
dropdown or multi-select backed by a static array of `{ label, value }` objects defined at
development time.

This works for options that are truly constant (e.g. log levels). It breaks down for options that
are merchant-specific. A payment methods field, for example, must reflect which gateways the
merchant has enabled in their Commerce store, something the app developer cannot know in advance.
There is currently no way to express this in the schema.

**Goals**

- Extend `list` fields to accept a factory for `options` via `MaybeDynamic` wrapper types;
  `default` can also be a function that derives its value from the resolved options.
- The existing `list` type and its static array contract are unchanged.
- Consumers (e.g. App Management UI) receive a fully resolved `list`-shaped field; no changes
  required on the consumer side.

**Non-goals**

- Dynamic field types (making a field appear or disappear at runtime).
- Dynamic whole-schema factories (replacing the entire schema at runtime).
- Centralising option resolution in a single action (see Unresolved questions).
- Validating submitted configuration values against the resolved list options.

## Developer experience

### Defining a field with dynamic options

Before this feature, a payment method selector requires hard-coded options:

```ts
const schema: BusinessConfigSchema = [
  {
    name: "paymentMethod",
    label: "Default Payment Method",
    type: "list",
    selectionMode: "single",
    options: [
      { label: "Braintree", value: "braintree" },
      { label: "PayPal", value: "paypal" },
    ],
    default: "braintree",
  },
];
```

With this feature, `list` fields can supply a factory function for `options` instead of a static
array. `default` can also be a function that derives its value from the resolved options:

```ts
import { fetchPaymentMethods } from "../lib/commerce.js";

const schema: MaybeDynamicBusinessConfigSchema = [
  // Single selection — default required (static or derived from resolved options)
  {
    name: "paymentMethod",
    label: "Default Payment Method",
    type: "list",
    selectionMode: "single",
    options: async (params) => {
      const methods = await fetchPaymentMethods(params.SOME_API_KEY);
      return methods.map((m) => ({ label: m.title, value: m.code }));
    },
    default: (resolvedOptions) => resolvedOptions[0].value,
  },
  // Multiple selection — default optional, falls back to []
  {
    name: "paymentMethods",
    label: "Enabled Payment Methods",
    type: "list",
    selectionMode: "multiple",
    options: async (params) => {
      const methods = await fetchPaymentMethods(params.SOME_API_KEY);
      return methods.map((m) => ({ label: m.title, value: m.code }));
    },
  },
];
```

The factory is a plain function (sync or async). It receives `params`, the same object passed to
any App Builder runtime action, so it has access to everything the action does: declared inputs,
environment variables, and OpenWhisk system parameters.

### Providing secrets to the factory

The factory runs inside an App Builder action. Any external credentials it needs must be available
in `params`, which means they must be declared as `inputs` in the action's `ext.config.yaml`.

Because the factory is resolved independently in each action that uses the schema (see Design), the
inputs must be declared in each relevant extension point's `ext.config.yaml`. The `app-config`
action lives in the extensibility extension and the `config` action lives in the configuration
extension, in two separate files:

```yaml
# src/commerce-extensibility-1/ext.config.yaml
runtimeManifest:
  packages:
    app-management:
      actions:
        app-config:
          # ... existing config ...
          inputs:
            SOME_API_KEY: $SOME_API_KEY
```

```yaml
# src/commerce-configuration-1/ext.config.yaml
runtimeManifest:
  packages:
    app-management:
      actions:
        config:
          # ... existing config ...
          inputs:
            SOME_API_KEY: $SOME_API_KEY
```

The values are sourced from the developer's `.env` file (local), following the standard App Builder pattern. Nothing changes about how secrets are managed, only that the same secret may now need to appear in more than one extension point's config.

### What merchants see

From the merchant's perspective, the field works identically to a static list field: they see a
dropdown populated with options. The difference is entirely in how the developer defines those
options. No new UI concepts are introduced.

## Design

### `MaybeDynamic` types in `lib-config`

New types are added in
`packages/aio-commerce-lib-config/source/modules/schema/types.ts` to distinguish definition-time
schemas (which may contain factories) from resolved schemas (which always contain concrete arrays).
The existing `list` field type and its Valibot schema are extended to accept a factory for
`options` alongside the existing static array.

```ts
type ListOptionsFactory = (
  params: RuntimeActionParams,
) => ListOption[] | Promise<ListOption[]>;

type ListOptionsDefaultFactory = (
  resolvedOptions: ListOption[],
) => string | string[];

// Extends the static list field to allow a factory for options and/or default
type MaybeDynamicBusinessConfigSchemaListField = Omit<
  BusinessConfigSchemaListField,
  "options" | "default"
> & {
  options: ListOption[] | ListOptionsFactory;
  default?: string | string[] | ListOptionsDefaultFactory;
};

type MaybeDynamicBusinessConfigSchemaField =
  | Exclude<BusinessConfigSchemaField, { type: "list" }>
  | MaybeDynamicBusinessConfigSchemaListField;

type MaybeDynamicBusinessConfigSchema = MaybeDynamicBusinessConfigSchemaField[];
```

`default` follows the same rules as on a static `list` field: required for
`selectionMode: "single"` (an error is thrown at resolution time if absent), optional for
`selectionMode: "multiple"` (falls back to `[]`). When `default` is a `ListOptionsDefaultFactory`,
it is called with the resolved options array after the `options` factory resolves.

Because `ListOptionsFactory` is a function, the Valibot schema accepts any function for `options`
at schema-definition time and defers correctness to the return value at resolution time. The same
applies to `default` when it is a function.

### Resolution utility

A new function `resolveDynamicBusinessConfigSchema` is added in
`packages/aio-commerce-lib-config/source/modules/schema/utils.ts`, alongside existing schema
helpers such as `validateBusinessConfigSchema` and `getPasswordFields`. It is the single entry
point for resolving all dynamic parts of a schema. Today it only resolves list option factories, but
designed to handle any future dynamic schema features through the same call:

```ts
function resolveDynamicBusinessConfigSchema(
  schema: MaybeDynamicBusinessConfigSchema,
  params: RuntimeActionParams,
): Promise<BusinessConfigSchema>;
```

- Iterates the schema and, for each `list` field whose `options` is a function, calls the factory
  with `params` to produce a `ListOption[]`, then evaluates `default` (calling the default factory
  with the resolved options if it is a function), and returns the field with concrete values.
- `list` fields with a static `options` array and all other field types are returned unchanged.
- Each resolved options array is validated against `v.array(ListOptionSchema)` before being used,
  so a factory that returns malformed data surfaces a clear error.
- If an options factory throws or rejects, schema resolution fails and the error propagates to the
  caller. Generated runtime actions surface that failure as an action error.
- Returns a new schema object; the original is not mutated.

### Impact on code generation

The current `pre-app-build` hook for the `configuration/1` extension serializes the business
configuration schema to `.generated/configuration-schema.json` using `safe-stable-stringify`. The
generated action template then imports it as a JSON module:

```js
import configSchema from "../../configuration-schema.json" with { type: "json" };
```

Factory functions cannot be JSON-serialized and would be silently stripped. This pipeline must
change when the schema contains dynamic options.

**Detection**: during `pre-app-build`, after loading the developer's config via `jiti`, check
whether any `list` field has a function for `options`. The `hasDynamicSchema()` helper in
`lib-config` (which delegates to `hasDynamicListOptions()`) provides this check.

**If no factories are present**: existing behavior unchanged. The schema is serialized to
`configuration-schema.json` and the generated action imports it as a JSON module.

**If any factory is present**: the hook generates a `configuration-schema.js` file with the schema
inlined as JavaScript code. The hook already loads the developer's config via `jiti` (which handles
TypeScript); the generated file duplicates the loaded schema as a JS module, serializing static
values as literals and factory functions via their source representation. Importing the TypeScript
source directly from the generated action is not viable since the project may not have a
TypeScript setup.

```js
// .generated/actions/app-management/config.js
import { schema as configSchema } from "../../configuration-schema.js";
```

The same change applies to the `app-config` action template.

### Integration with `lib-app` actions

Both the `app-config` and `config` actions call `resolveDynamicBusinessConfigSchema` before using
the schema. Each action passes its own `params`, so the factory has access to the inputs declared
for that specific action.

- **`app-config` action (GET /)**: resolves the schema before including it in the manifest
  response.
- **`config` action (GET /)**: resolves the schema before returning it alongside configuration
  values; the App Management UI uses this to render the form.
- **`config` action (PUT /, PATCH /)**: resolves the schema before using it for configuration
  operations. Validating submitted values against the resolved option set is out of scope for this
  feature and should be handled separately.

### Schema definition vs. resolved schema

It is useful to distinguish two points in time:

1. **Definition time**: the developer's `schema` object, typed as
   `MaybeDynamicBusinessConfigSchema`. `list` fields may carry a `ListOptionsFactory` for `options`
   and/or a `ListOptionsDefaultFactory` for `default`.
2. **Resolution time**: the fully resolved schema, typed as `BusinessConfigSchema`. All `list`
   fields have concrete `options` arrays and resolved `default` values. This is what the existing
   validation and rendering code receives, and its shape does not change.

### Returning to the examples

Given the `paymentMethod` example above:

- When `config` handles a `GET /`, it calls `resolveDynamicBusinessConfigSchema` and returns a
  `schema` array where `paymentMethod.options` is a concrete `ListOption[]`, populated from the
  merchant's Commerce store. The App Management UI renders this directly as a dropdown.
- When `config` handles a `PUT /` or `PATCH /`, it calls `resolveDynamicBusinessConfigSchema`
  before configuration operations, so the action uses a concrete schema. Enforcing that submitted
  list values are present in the resolved option set is separate validation work.

## Drawbacks

**Input duplication.** A factory that calls an external API needs credentials in `params`. Those
credentials must appear in `inputs` under every action that resolves the factory. For apps with
several dynamic fields calling the same API, this is boilerplate that worsens as more actions are
involved.

**Runtime-only errors.** A factory with a bug (wrong API call, unexpected response shape) fails at
runtime, not when the developer defines the schema. Static options are validated before the project is deployed;
dynamic options are not.

**Per-request latency.** Every request to an action that uses a dynamic field incurs the factory's
async call. For fields that call slow or rate-limited external APIs this adds observable latency to
every config GET and PATCH.

## Rationale and alternatives

**Why not a user-space workaround?**  
The schema is a static closure captured at action startup. There is no existing hook that would let
a developer inject a different options array per request without SDK changes.

**Options as a URL (the SDK fetches them).**  
The SDK could accept a URL string and fetch the options itself. Rejected: this limits developers to
endpoints the SDK can reach without custom auth logic and removes the ability to transform the
response shape.

**A "refresh options" button in the UI.**  
Options freshness is not a UI concern; it is a resolution concern. Because `resolveDynamicBusinessConfigSchema`
is called on every request, the frontend already receives up-to-date options on any `config GET /`.
A refresh is simply re-fetching the config response; no additional SDK work is needed.

**Why `MaybeDynamic` wrappers instead of a separate `dynamicList` type?**  
A separate `dynamicList` type would break backwards compatibility: existing schemas typed as
`BusinessConfigSchema` would not accept the new type without a union, and consumers that switch on
`field.type` would need updating. The `MaybeDynamic` wrapper preserves the `list` type value
throughout — only the TypeScript type of `options` widens at definition time and narrows back at
resolution time. The distinction is entirely SDK-internal; consumers and existing code are
unaffected.

**Factory at the schema level (not the field level).**  
The previous implementation supported a factory that returned the entire schema. Rejected for this
spec: it is broader than the stated need and makes the schema shape harder to reason about
statically. It can be revisited independently.

**What is the impact of not doing this?**  
Apps that need merchant-specific or any other dynamic options cannot express them through the schema and must work around the limitation outside the SDK.

## Unresolved questions

**Centralising resolution.**  
Each action that needs a resolved schema currently calls the factory independently, which means
secrets must be in the `inputs` of each action and each factory call performs a separate network
round-trip. An alternative would be to have the `config` and other actions invoke the `app-config`
action to obtain a pre-resolved schema. This reduces duplication but introduces action-to-action
coupling. This tradeoff should be evaluated before implementation.

**Empty options.**  
Should the SDK validate that a resolved options array is non-empty? A factory that returns `[]`
would produce a list field with no choices, which is probably a developer error but could also be a
valid transient state.

## Future possibilities

**Resolved option value validation.** The SDK could validate submitted single-select and
multi-select list values against the resolved option set during configuration writes. That belongs
to a separate validation-focused change because existing configuration writes currently validate
value shape, not membership in list options.

**Dynamic field visibility.** The same pattern (factory function that receives `params`) could
extend to other schema properties, for example whether a field is shown at all. This is a natural
next step once dynamic options are stable.

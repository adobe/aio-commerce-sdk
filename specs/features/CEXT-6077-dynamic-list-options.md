# Dynamic list options

- **Ticket:** [CEXT-6077](https://jira.corp.adobe.com/browse/CEXT-6077)
- **Created:** 2026-05-07
- [ ] **Implemented**

## Summary

Introduce a new `dynamicList` field type for business configuration schemas. Unlike the existing
`list` type, a `dynamicList` field resolves its options at runtime via a factory function, enabling
app developers to populate select dropdowns with values fetched from external APIs (such as payment
methods or store views available in a specific merchant's Commerce installation).
`BusinessConfigSchema` is widened to accept `dynamicList` fields alongside existing static field
types. A new `ResolvedBusinessConfigSchema` type represents the post-resolution form where all
`dynamicList` fields have been converted to concrete `list` fields.

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

- Introduce `type: "dynamicList"` as a new field type with its own explicit contract.
- The options factory receives `params` and returns `ListOption[]`; on a `dynamicList` field,
  `default` is a factory that derives its value from the resolved options.
- Widen `BusinessConfigSchema` to include `dynamicList` fields and introduce
  `ResolvedBusinessConfigSchema` as the post-resolution type containing only static fields.
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

With this feature, a new field type `dynamicList` is available. `options` is a factory function
that receives `params` and returns a `ListOption[]`. `default` can be a static value or a function
that derives its value from the resolved options:

```ts
import { fetchPaymentMethods } from "../lib/commerce.js";

const schema: BusinessConfigSchema = [
  // Single selection — default required
  {
    name: "paymentMethod",
    label: "Default Payment Method",
    type: "dynamicList",
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
    type: "dynamicList",
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
# ext.config.yaml (app-config action)
runtimeManifest:
  packages:
    app-management:
      actions:
        app-config:
          inputs:
            SOME_API_KEY: $SOME_API_KEY
```

```yaml
# ext.config.yaml (config action)
runtimeManifest:
  packages:
    app-management:
      actions:
        config:
          inputs:
            SOME_API_KEY: $SOME_API_KEY
```

Nothing changes about how secrets are managed; the same secret may now need to appear in more than one extension point's config.

### What merchants see

From the merchant's perspective, the field works identically to a static list field: they see a
dropdown populated with options. The difference is entirely in how the developer defines those
options. No new UI concepts are introduced.

## Design

### New `dynamicList` field type and `ResolvedBusinessConfigSchema` in `lib-config`

A new field type `"dynamicList"` is added to `lib-config` alongside the existing field types. The
`list` type and its schema are unchanged.

The options factory returns a plain `ListOption[]`; `default` is a factory that derives its value
from the resolved options:

```ts
type ListOptionsFactory = (
  params: RuntimeActionParams,
) => ListOption[] | Promise<ListOption[]>;

type ListOptionsDefaultFactory = (
  resolvedOptions: ListOption[],
) => string | string[];

type DynamicListField = {
  name: string;
  label?: string;
  description?: string;
  type: "dynamicList";
  selectionMode: "single" | "multiple";
  options: ListOptionsFactory;
  default?: ListOptionsDefaultFactory;
};
```

`default` is called with the resolved options array after the `options` factory resolves. It is
required for `selectionMode: "single"` (an error is thrown at resolution time if absent) and
optional for `selectionMode: "multiple"` (falls back to `[]`).

Because both factories are functions, neither `options` nor `default` can be validated at
schema-definition time; correctness is deferred to their return values at resolution time.

`BusinessConfigSchema` in `lib-config` is widened to include `DynamicListField` alongside the
existing static field types. A new `ResolvedBusinessConfigSchema` type represents the
post-resolution form, containing only static fields:

```ts
type BusinessConfigSchema = (BusinessConfigSchemaField | DynamicListField)[];

type ResolvedBusinessConfigSchema = BusinessConfigSchemaField[];
```

Existing schemas typed as `BusinessConfigSchema` that contain only static fields remain valid; the
widening is additive.

### Resolution utility

A new function `resolveBusinessConfigSchema` is added to `lib-config`. It is the single
entry point for resolving all dynamic parts of a schema. Today it only resolves `dynamicList`
fields, but is designed to handle any future dynamic schema features through the same call:

```ts
function resolveBusinessConfigSchema(
  schema: BusinessConfigSchema,
  params: RuntimeActionParams,
): Promise<ResolvedBusinessConfigSchema>;
```

- Each `dynamicList` field is resolved to an equivalent `list`-shaped field with concrete options
  and a resolved `default` value. All other field types pass through unchanged.
- A factory that returns malformed data or throws surfaces a clear error; schema resolution fails
  and the error propagates to the caller.
- Returns a new `ResolvedBusinessConfigSchema`; the original is not mutated.

### Impact on code generation

The current `pre-app-build` hook for the `configuration/1` extension serializes the business
configuration schema to `.generated/configuration-schema.json` using `safe-stable-stringify`. The
generated action template then imports it as a JSON module:

```js
import configSchema from "../../configuration-schema.json" with { type: "json" };
```

Factory functions cannot be JSON-serialized and would be silently stripped. This pipeline must
change when the schema contains dynamic options.

**Detection**: during `pre-app-build`, check whether any field has `type: "dynamicList"`.
`lib-config` exposes a helper for this check.

**If no factories are present**: existing behavior unchanged. The schema is serialized to
`configuration-schema.json` and the generated action imports it as a JSON module.

**If any factory is present**: the hook generates a `configuration-schema.js` file with the schema
inlined as JavaScript code, so factory functions are preserved. The same change applies to the
`app-config` action template.

### Integration with `lib-app` actions

Both the `app-config` and `config` actions call `resolveBusinessConfigSchema` before using
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

1. **Definition time**: the developer's `schema` object, typed as `BusinessConfigSchema`. It may
   contain `dynamicList` fields with factory functions for `options` and/or `default`.
2. **Resolution time**: the fully resolved schema, typed as `ResolvedBusinessConfigSchema`. All
   `dynamicList` fields have been converted to `list`-shaped fields with concrete `options` arrays
   and resolved `default` values. This is what the existing validation and rendering code receives,
   and its shape does not change.

### Returning to the examples

Given the `paymentMethod` example above:

- When `config` handles a `GET /`, it calls `resolveBusinessConfigSchema` and returns a
  `schema` array where `paymentMethod.options` is a concrete `ListOption[]`, populated from the
  merchant's Commerce store. The App Management UI renders this directly as a dropdown.
- When `config` handles a `PUT /` or `PATCH /`, it calls `resolveBusinessConfigSchema`
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
Options freshness is not a UI concern; it is a resolution concern. Because `resolveBusinessConfigSchema`
is called on every request, the frontend already receives up-to-date options on any `config GET /`.
A refresh is simply re-fetching the config response; no additional SDK work is needed.

**Why a separate `dynamicList` type instead of extending `list`?**  
A separate type makes the contract explicit at definition time: a `dynamicList` field always has a
factory; a `list` field always has a static array. Mixing the two in a union on `list` would make
the static guarantee of `BusinessConfigSchema` meaningless and complicate schema validation in
ways that are hard to check statically. Consumers always receive a `list`-shaped field after
resolution, so the distinction is SDK-internal.

**Why widen `BusinessConfigSchema` rather than introduce a separate input type?**  
A separate input type (e.g. `MaybeDynamicBusinessConfigSchema`) would require every API that today
accepts `BusinessConfigSchema` to be updated, and would leave developers with two schema type names
to reason about. Widening `BusinessConfigSchema` directly is additive: existing static schemas
remain valid, existing type annotations compile unchanged, and there is one canonical type name for
"the schema a developer writes." The resolved form gets its own name, `ResolvedBusinessConfigSchema`,
which makes the post-resolution guarantee explicit without inventing additional intermediate types.

**Factory at the schema level (not the field level).**  
Rejected for this spec: it is broader than the stated need and makes the schema shape harder to
reason about statically. It can be revisited independently.

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

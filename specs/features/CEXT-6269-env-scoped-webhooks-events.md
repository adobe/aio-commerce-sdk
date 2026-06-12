# Environment-Scoped Webhooks and Events

- **Ticket:** [CEXT-6269](https://jira.corp.adobe.com/browse/CEXT-6269)
- **Created:** 2026-06-03
- [x] **Implemented**

## Summary

Add an optional `env` array (`"paas"` / `"saas"`) to webhook and event configuration,
mirroring the field-level environment scoping that already exists in
`@adobe/aio-commerce-lib-config`. When `env` is omitted, the webhook or event applies to
all supported Commerce environments; when it is set, the item only applies to the listed
environments. At installation time, items are filtered to the target Commerce environment,
and an event provider left with no applicable events has neither its provider nor its
registration created. The `app-config` action returns webhooks and events already filtered
by environment, so App Management displays the correct, scoped set without any client-side
filtering — consistent with how Business Configurations is already scoped.

## Motivation

Commerce apps built with the SDK can be installed against both PaaS (on-prem / Adobe
Commerce Cloud) and SaaS (Adobe Commerce as a Cloud Service) instances. Some extensibility
components are only meaningful on one environment — for example, a webhook that hooks into a
PaaS-only plugin, or an event tied to a SaaS-only capability. Today there is no way to
express this: every webhook and event declared in `app.commerce.config.*` is installed for
every environment. The consequences are concrete:

- Irrelevant I/O Events providers and registrations are created on environments where the
  underlying events never fire.
- Webhook subscriptions are registered against Commerce environments that don't expose the
  corresponding hook.
- Developers have no single, consistent way to scope extensibility components, even though
  Business Configurations already solved this exact problem.

`@adobe/aio-commerce-lib-config` already lets a schema field declare an optional `env`
array so it only surfaces on matching environments (see lib-config's
[Conditional Fields by Commerce Environment](../../packages/aio-commerce-lib-config/docs/usage.md#conditional-fields-by-commerce-environment)).
Developers reasonably expect the same capability — with the same shape and wording — for
webhooks and events.

**Goals:**

- Declarative, per-item environment scoping for webhooks and events using the same `env`
  shape and semantics as lib-config.
- Correct install-time filtering: only items applicable to the target environment are
  created.
- When an event provider has zero applicable events for the target environment, neither the
  provider nor its registration is created.
- Consistent copy, labels, and behavior across Business Configurations, webhooks, and
  events.
- Updated documentation explaining environment scoping for webhooks and events, with
  examples and the supported environment values.

**Non-goals:**

- Changing the existing lib-config `env` semantics.
- Runtime (post-install) filtering of event delivery or webhook dispatch — scoping happens
  at installation only.
- Any change to how Commerce itself models environments.
- Visually badging the environment in App Management (Business Configurations does not do
  this today; this spec keeps filtering silent for consistency).

## Developer experience

Environment scoping is declared with an optional `env` array on each webhook entry and each
event, exactly like a Business Configuration field. The accepted values are `"paas"` and
`"saas"`, and one or more may be listed. Omitting `env` keeps today's behavior — the item
applies to every environment — so adding `env` to an existing app is fully backward
compatible; existing configs are unaffected until a developer opts in.

**Webhooks** — scope an individual webhook entry:

```ts
webhooks: [
  {
    label: "Validate stock on PaaS",
    description: "Inventory check that only exists on Adobe Commerce (PaaS).",
    runtimeAction: "my-package/validate-stock",
    env: ["paas"],
    webhook: {
      webhook_method: "observer",
      webhook_type: "before",
      batch_name: "stock",
      hook_name: "validate",
      method: "POST",
    },
  },
  {
    label: "Audit log",
    description: "Applies to every environment (no env declared).",
    runtimeAction: "my-package/audit",
    webhook: {
      webhook_method: "observer",
      webhook_type: "after",
      batch_name: "audit",
      hook_name: "log",
      method: "POST",
    },
  },
];
```

**Events** — scope individual events within a provider:

```ts
eventing: {
  commerce: [
    {
      provider: { label: "Orders" },
      events: [
        { name: "observer.sales_order_place_after", label: "Order placed",
          description: "...", runtimeActions: ["my-package/on-order"], fields: [{ name: "increment_id" }],
          env: ["saas"] },
        { name: "observer.catalog_product_save_after", label: "Product saved",
          description: "...", runtimeActions: ["my-package/on-product"], fields: [{ name: "sku" }] },
        // no env -> applies to all environments
      ],
    },
  ],
}
```

On a PaaS installation, the first event above is skipped. If every event in a provider is
scoped to environments that don't match the target, the whole provider is skipped: no I/O
Events provider is created, and no registration is made. On a SaaS installation, both
events are created.

Invalid declarations are rejected at config-validation time with the same messages as
lib-config: an empty `env` array (`'The "env" array must contain at least one commerce
environment'`) or an unknown value (`'Expected one of: "paas", "saas"'`).

## Design

### Shared `env` schema

The Commerce environment is already a first-class concept in `@adobe/aio-commerce-lib-core`'s
dependency tree: lib-api defines the `"paas" | "saas"` union as `CommerceFlavor`, and
lib-config privately re-defines the same literals as `COMMERCE_ENVS`/`CommerceEnvSchema`/
`EnvSchema` (`packages/aio-commerce-lib-config/source/modules/schema/fields.ts`), as does the
config action (`aio-commerce-lib-app/source/actions/config/schema.ts`). Rather than add a
fourth copy, this PR establishes a single canonical home in **lib-core** — the lowest-level
public package, which every consumer (lib-config, lib-app, lib-webhooks) already depends on and
which already uses valibot. A new additive subpath export (e.g. `./commerce`) provides:

- `COMMERCE_ENVS = ["paas", "saas"] as const`
- `type CommerceEnv = (typeof COMMERCE_ENVS)[number]`
- `CommerceEnvSchema` — a picklist over `COMMERCE_ENVS`
- `CommerceEnvArraySchema` — a non-empty `v.array(CommerceEnvSchema)`

`CommerceEnvSchema`/`CommerceEnvArraySchema` are exported as **bare schema constants** (env
validators carry fixed messages — "Expected one of: …", "must contain at least one commerce
environment" — so there is no field `name` to parameterize). Call sites apply the optional
wrapper themselves: `env: v.optional(CommerceEnvArraySchema)`.

Because lib-api depends on lib-core, `CommerceFlavor` becomes an **alias** of lib-core's
`CommerceEnv` — so there is one type, not two kept in sync, and no drift-assertion is needed.
lib-config's private definitions and the config action's `COMMERCE_ENVS`/`CommerceEnv` are
refactored to consume lib-core; the config action keeps exporting `CommerceEnv` (now re-exported
from lib-core) so nothing is removed from the public surface and the bump stays `minor`.

### Schema placement

- **Events (per-event):** add `env: v.optional(CommerceEnvArraySchema)` to `BaseEventSchema`
  in `packages/aio-commerce-lib-app/source/config/schema/eventing.ts`, so both
  `CommerceEventSchema` and `ExternalEventSchema` inherit it. The inferred `CommerceEvent`,
  `ExternalEvent`, and `AppEvent` types pick up `env?` automatically.
- **Webhooks (per-entry):** add `env: v.optional(CommerceEnvArraySchema)` to both webhook
  entry schemas in `packages/aio-commerce-lib-app/source/config/schema/webhooks.ts`
  (`WebhookEntryWithRuntimeActionSchema`, `WebhookEntryWithUrlSchema`), alongside the
  existing `label` / `description` / `category` fields.

`env` is **not** added to the webhooks API payload
(`aio-commerce-lib-webhooks` `WebhookSubscribeParamsSchema`). It is installation-orchestration
metadata and is never sent to Commerce.

### The target environment at install time

Nothing is resolved or inferred at install: the install action already receives the
environment from its caller. `InstallationRequestBodySchema`
(`packages/aio-commerce-lib-app/source/actions/installation/schema.ts`) requires a
`commerceEnv` field, App Management sends it (derived from the active Commerce instance), and
the router maps it onto the workflow params as `AIO_COMMERCE_API_FLAVOR`
(`buildWorkflowParams` in `actions/installation/router.ts`). Install steps read it directly
from the params (`AIO_COMMERCE_API_FLAVOR`).

Because `commerceEnv` is a required install input, the environment is always known at install
time — there is no unresolved/`null` case to handle here.

### Install-time filtering

An item is kept when it has no `env`, or its `env` includes the install's environment. (The
`app-config` display path uses the same rule — see "app-config action: serving
environment-filtered config".)

- **Webhooks** — `management/installation/webhooks/helpers.ts`: filter in
  `createWebhookSubscriptions` so non-matching webhooks are not subscribed, and in
  `validateWebhookConflicts` so a webhook scoped to the other environment does not raise a
  spurious conflict. If the filtered list is empty, the step is a successful no-op.
- **Commerce events** — `management/installation/events/commerce.ts`: filter each provider's
  events before onboarding, and skip any provider with no applicable events so that no
  provider and no registration are created for it. The existing one-time
  eventing-module configuration must still run even when the first provider is skipped — today
  it is tied to the first loop iteration, which no longer holds once providers can be skipped.
- **External events** — `management/installation/events/external.ts`: same per-provider
  filter and skip-empty-provider logic.

The existing `hasCommerceEvents` / `hasExternalEvents` / `hasWebhooks` `when` predicates are
config-shape checks that run before filtering and are unchanged. Empty-after-filter handling
lives inside the leaf-step install functions; a provider that exists in config but is fully
filtered out causes the branch `when` to be true and the step to run, then produce empty
step data — which is acceptable.

### app-config action: serving environment-filtered config

App Management renders its webhook/event summaries from the configuration returned by the
`app-config` action (`GET /app-config/`,
`packages/aio-commerce-lib-app/source/actions/app-config/router.ts`). The `config` action
already establishes the pattern for environment-scoped display: it accepts an optional
`commerceEnv` query param and filters the business-config schema server-side via
`filterSchemaByEnv` before returning (`actions/config/router.ts`). The `app-config` action
adopts the same pattern:

- Add an **optional** `commerceEnv` query param to `GET /app-config/`, mirroring
  `GetConfigurationQuerySchema` in `actions/config/schema.ts`.
- When present, filter the returned `webhooks` and `eventing` (per-event, dropping providers
  left with no applicable events) using the same predicate as install, before returning the
  validated config.
- When **absent**, the action returns the full, unfiltered config exactly as it does today —
  fully backward compatible. Existing callers that do not send `commerceEnv` see no change in
  behavior or response shape. This matches the `config` action, which returns the unfiltered
  schema when the param is omitted.

This applies the same keep rule as install. The one difference is that `commerceEnv` is
optional here (an absent param returns the full, unfiltered config), whereas at install it is a
required input — so display filtering only ever runs with a concrete `"paas"` / `"saas"` value.
`filterSchemaByEnv` is not reused directly: webhooks are a flat array (filtered like the
schema), while `eventing` requires filtering each provider's events and then dropping any
provider with no remaining events.

This keeps the entire enforcement and display surface server-side and consistent with
Business Configurations. Because `GET /app-config/` gains a query parameter, the hand-
maintained `docs/openapi.json` and its `info.version` must be updated in the same PR (per the
lib-app package conventions; the bump is `minor`, an additive optional param) and validated
with `pnpm --filter @adobe/aio-commerce-lib-app run lint:openapi`.

### Documentation

The same PR updates `packages/aio-commerce-lib-app/docs/usage.md`: the webhooks and events
sections gain an environment-scoping subsection that explains the `env` field, lists the
supported values (`"paas"`, `"saas"`), states the omitted-means-all default, and shows config
examples — mirroring lib-config's "Conditional Fields by Commerce Environment". The new schema
entries also carry JSDoc so the auto-generated API reference picks them up (the reference
itself is not regenerated in this PR). The lib-webhooks API package is unchanged, so its docs
are not affected. A changeset is included; the bump is minor (additive optional fields and an
additive optional query param; no public surface removed — see Shared `env` schema).

If any `plugins/` migration or scaffolding skill references the webhook/event config shape, it
is updated to reflect the new `env` field in the same PR.

### Uninstall

Uninstall (`deleteWebhookSubscriptions`, `removeCommerceEvents`, `removeExternalEvents`) does
**not** filter by `env`. Offboarding is best-effort and idempotent, and skipping the filter
ensures everything that may have been created is removed even if an app's `env` declarations
changed between install and uninstall — avoiding orphaned providers, registrations, and
subscriptions.

### Edge cases

- **Invalid `env` (empty array or unknown value)** — rejected at config validation (see
  Developer experience for the exact messages).
- **Provider with all events filtered out** — skipped: no provider, no registration, no
  subscriptions.
- **All webhooks filtered out for the install's environment** — the subscription step returns
  an empty result; no conflicts; step succeeds as a no-op.

### App Management UI (consumer repo)

App Management needs one small change — a cross-repo work item that must not be missed (per
AGENTS.md, consumer content stays in sync with the SDK):

- Forward the current `commerceEnv` as a query param on the app-config request, exactly as it
  already does for the business-config request. The value already exists in App Management —
  read from the active Commerce instance, the same source and value used for business-config —
  so the change is purely to pass it through.

The existing summary components then render the already-scoped config unchanged: no
client-side filtering, no new badge or label.

## Drawbacks

- One more field for developers to learn, though the cost is low because it mirrors an
  existing concept.
- Install filters by `env` but uninstall does not (see Uninstall), an asymmetry that must be
  reasoned about carefully to avoid orphaned resources.

## Rationale and alternatives

- **`env` array vs. a single `environment` string.** The array matches lib-config exactly
  and supports multi-environment scoping (`["paas", "saas"]`); a single string would diverge
  from the established pattern and the goal of cross-component consistency. Rejected the single
  string.
- **Per-event vs. per-provider scoping for events.** Per-event scoping plus a
  skip-empty-provider rule naturally expresses "create no provider or registration when nothing
  applies". Per-provider scoping is coarser and cannot express "this provider has both
  PaaS-only and SaaS-only events". Chose per-event.
- **Leaving filtering to consumers (as lib-config does).** lib-config is purely declarative
  and relies on consumers to filter. Here the SDK must skip provider/registration creation at
  install, so the SDK itself must filter. Rejected the consumer-only approach.
- **Consistency of copy and behavior.** Achieved by _not_ introducing any new UI surface:
  filtering is silent across Business Configurations, webhooks, and events (no badge or label),
  exactly as Business Configurations behaves today. The only shared "copy" is the validation
  messaging, reused verbatim from lib-config.
- **Impact of not doing this.** Developers cannot scope extensibility components; irrelevant
  providers, registrations, and subscriptions continue to be created on every environment,
  and the experience stays inconsistent with Business Configurations.

## Unresolved questions

The core design is settled (env shape, per-event scoping with empty-provider skip, no
uninstall filtering, shared schema consolidated in lib-core with `CommerceFlavor` aliasing
`CommerceEnv`). One implementation-time item remains:

- **Cross-repo rollout coordination** — the `commerceEnv` query param on `app-config` is
  forward-compatible (App Management can adopt it before or after the SDK ships, since an absent
  param returns the full config), so this is a sequencing question, not a blocking dependency.

## Future possibilities

- Apply the same `env` scoping to any future extensibility component, using the shared lib-core
  schema.
- A shared "environment-scoped item" filter helper if more components adopt the pattern.
- If Business Configurations later renders the environment scope visually, webhooks and
  events could adopt the same badge for full UI parity.

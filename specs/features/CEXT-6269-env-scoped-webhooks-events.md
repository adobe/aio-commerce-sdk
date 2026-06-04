# Environment-Scoped Webhooks and Events

- **Ticket:** [CEXT-6269](https://jira.corp.adobe.com/browse/CEXT-6269)
- **Created:** 2026-06-03
- [ ] **Implemented**

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
applies to every environment — so existing configs are unaffected.

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

Because `env` is optional and defaults to "all environments", adding it to an existing app
is fully backward compatible — nothing changes until a developer opts in.

Invalid declarations are rejected at config-validation time with the same messages as
lib-config: an empty `env` array ("must contain at least one commerce environment") or an
unknown value ("Expected one of: \"paas\", \"saas\"").

## Design

### Shared `env` schema

lib-config currently defines `COMMERCE_ENVS`, `CommerceEnvSchema`, and `EnvSchema`
privately in
`packages/aio-commerce-lib-config/source/modules/schema/fields.ts` and exports none of
them. To keep a single source of truth across components, extract the env primitives into
`@aio-commerce-sdk/common-utils` (`packages-private/common-utils/source/valibot/`), which is
already the home for shared valibot helpers (e.g. `nonEmptyStringValueSchema`) consumed by
the lib-app eventing and webhook _config_ schemas this change edits
(`config/schema/eventing.ts`, `config/schema/webhooks.ts`):

- `COMMERCE_ENVS = ["paas", "saas"] as const`
- `commerceEnvSchema()` — picklist over `COMMERCE_ENVS`
- `envSchema()` — optional non-empty array of `commerceEnvSchema()`
- `type CommerceEnv = "paas" | "saas"`

`COMMERCE_ENVS` is currently duplicated in two places — lib-config's `BaseOptionSchema.env`
(`source/modules/schema/fields.ts`) and the config action's query schema
(`aio-commerce-lib-app/source/actions/config/schema.ts`, which also exports a `CommerceEnv`
type). Adding the literal to the webhook/event schemas would make it a third copy; instead,
this PR consolidates all of them onto the shared common-utils definitions and removes the
private copies, so the feature ships with a single source of truth. The `COMMERCE_ENVS`
literals must stay in sync with lib-api's `CommerceFlavor` (`"paas" | "saas"`); a type-level
assertion test guards against drift. common-utils must not depend on lib-api, so the literals
live in common-utils and the assertion lives where both are visible.

### Schema placement

- **Events (per-event):** add `env: v.optional(envSchema())` to `BaseEventSchema` in
  `packages/aio-commerce-lib-app/source/config/schema/eventing.ts`, so both
  `CommerceEventSchema` and `ExternalEventSchema` inherit it. The inferred `CommerceEvent`,
  `ExternalEvent`, and `AppEvent` types pick up `env?` automatically.
- **Webhooks (per-entry):** add `env: v.optional(envSchema())` to both webhook entry
  schemas in `packages/aio-commerce-lib-app/source/config/schema/webhooks.ts`
  (`WebhookEntryWithRuntimeActionSchema`, `WebhookEntryWithUrlSchema`), alongside the
  existing `label` / `description` / `category` fields.

`env` is **not** added to the webhooks API payload
(`aio-commerce-lib-webhooks` `WebhookSubscribeParamsSchema`). It is installation-orchestration
metadata and is never sent to Commerce.

### Detecting the target environment at install time

The Commerce environment is derived from the installation params via lib-api's
`resolveCommerceHttpClientParams(params)`, which yields a `CommerceFlavor` (`"paas"` /
`"saas"`) — resolved from `AIO_COMMERCE_API_FLAVOR` or inferred from
`AIO_COMMERCE_API_BASE_URL` (see
`packages/aio-commerce-lib-api/source/lib/commerce/helpers.ts`). The auth strategy (IMS vs
Integration) is **not** a valid proxy for the environment — PaaS may use either, so only the
API URL or explicit environment param is authoritative.

The resolved environment is surfaced on the events and webhooks step contexts
(`management/installation/events/context.ts`, `management/installation/webhooks/context.ts`),
matching the existing lazy-client pattern, so each install step can read it without
re-deriving.

### Install-time filtering

The filtering predicate, applied uniformly: keep an item when its `env` is `undefined`, OR
the environment could not be resolved (`null`), OR `env` includes the resolved environment.

- **Webhooks** — `management/installation/webhooks/helpers.ts`: filter in
  `createWebhookSubscriptions` so non-matching webhooks are not subscribed, and in
  `validateWebhookConflicts` so a webhook scoped to the other environment does not raise a
  spurious conflict. If the filtered list is empty, the step is a successful no-op.
- **Commerce events** — `management/installation/events/commerce.ts`: filter each provider's
  `events[]` before onboarding. If the applicable list is empty, skip the provider entirely
  (`continue`), which means no `onboardIoEvents`, no provider, and no registration —
  satisfying the AC. Pass the filtered list (not the full one) into onboarding. The current
  once-only `configureCommerceEventing` guard keyed on the loop index (`i === 0`) must be
  replaced with a "first non-skipped provider" flag, so skipping the first provider does not
  drop the one-time eventing-module configuration.
- **External events** — `management/installation/events/external.ts`: same per-provider
  filter and skip-empty-provider logic. External events never touch Commerce, so when the
  environment is unresolved they all apply.

The existing `hasCommerceEvents` / `hasExternalEvents` / `hasWebhooks` `when` predicates are
config-shape checks that run before filtering and are unchanged. Empty-after-filter handling
lives inside the leaf-step install functions; a provider that exists in config but is fully
filtered out causes the branch `when` to be true and the step to run, then produce empty
step data — which is acceptable.

### Serving environment-filtered config to App Management

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

The per-item predicate is `env === undefined || env.includes(commerceEnv)`. This is the
install-time predicate without its "environment unresolved (`null`)" branch: on the display
path that branch is unreachable, because an absent `commerceEnv` param returns the full,
unfiltered config (so filtering only ever runs with a concrete `"paas"` / `"saas"` value).
`filterSchemaByEnv` is not reused directly: webhooks are a flat array (filtered like the
schema), while `eventing` requires filtering each provider's `events[]` and then dropping any
provider with no remaining events. Two small filter helpers cover this.

This keeps the entire enforcement and display surface server-side and consistent with
Business Configurations. Because `GET /app-config/` gains a query parameter, the hand-
maintained `docs/openapi.json` and its `info.version` must be updated in the same PR (per the
lib-app package conventions), and validated with `pnpm --filter @adobe/aio-commerce-lib-app
run lint:openapi`.

### Documentation

Per the AGENTS.md doc-sync rule, the same PR updates `packages/aio-commerce-lib-app/docs/usage.md`:
the webhooks and events sections gain an environment-scoping subsection that explains the
`env` field, lists the supported values (`"paas"`, `"saas"`), states the omitted-means-all
default, and shows config examples — mirroring lib-config's "Conditional Fields by Commerce
Environment". The new schema entries also carry JSDoc so the auto-generated API reference picks
them up (the reference itself is not regenerated in this PR). The lib-webhooks API package is
unchanged, so its docs are not affected. A changeset is included; the bump is minor (additive
optional fields and an additive optional query param).

### Uninstall

Uninstall (`deleteWebhookSubscriptions`, `removeCommerceEvents`, `removeExternalEvents`) does
**not** filter by `env`. Offboarding is best-effort and idempotent, and skipping the filter
ensures everything that may have been created is removed even if an app's `env` declarations
changed between install and uninstall — avoiding orphaned providers, registrations, and
subscriptions.

### Edge cases

- **Empty `env` array** — rejected at validation by `envSchema()`'s non-empty check.
- **Unknown env value** — rejected by the picklist.
- **Provider with all events filtered out** — skipped: no provider, no registration, no
  subscriptions.
- **All webhooks filtered out** — `createWebhookSubscriptions` returns an empty result;
  no conflicts; step succeeds as a no-op.
- **Environment cannot be resolved** (e.g. an external-events-only install with no
  `AIO_COMMERCE_API_BASE_URL`) — apply to all: every item is installed regardless of its
  `env`, preserving current behavior. A warning is emitted only when a **webhook or Commerce
  event** declares `env` while the environment is unresolvable, since those genuinely depend
  on the Commerce environment and their scope was not enforced. External events are not warned
  about: they never touch Commerce and legitimately apply to all environments when Commerce is
  absent (see Install-time filtering), so an unresolved environment is their normal case, not a
  degraded fallback.

### App Management UI

App Management adds **no filtering logic** — the action returns the already-scoped config and
the existing summary components render it unchanged. It does, however, need one small change.
This is a cross-repo work item that must not be missed (per AGENTS.md, consumer content stays
in sync with the SDK).

What changes in App Management:

- Forward the current `commerceEnv` as a query param on the app-config request, exactly as it
  already does for the business-config request. The value already exists in App Management —
  read from the active Commerce instance, the same source and value used for business-config —
  so the change is purely to pass it through. No client-side filtering, no new badge or label.

## Drawbacks

- One more field for developers to learn, though the cost is low because it mirrors an
  existing concept.
- Install-time filtering introduces a dependency on Commerce environment resolution; installs
  that cannot resolve an environment fall back to "apply to all", which is a soft, possibly
  surprising default.
- Uninstall vs. install asymmetry (below) needs to be reasoned about carefully to avoid
  orphaned resources.

## Rationale and alternatives

- **`env` array vs. a single `environment` string.** The array matches lib-config exactly
  and supports multi-environment scoping (`["paas", "saas"]`); a single string would diverge
  from the established pattern and the consistency AC. Rejected the single string.
- **Per-event vs. per-provider scoping for events.** The AC requires that a provider with no
  applicable events is not created, which is naturally expressed by per-event scoping plus a
  skip-empty-provider rule. Per-provider scoping is coarser and cannot express "this provider
  has both PaaS-only and SaaS-only events". Chose per-event.
- **Detecting the environment from auth strategy.** Rejected — PaaS can use IMS or
  Integration auth, so auth strategy does not determine the environment. Only the API URL or
  explicit environment param does.
- **Leaving filtering to consumers (as lib-config does).** lib-config is purely declarative
  and relies on consumers to filter. Here the AC explicitly requires the SDK to skip
  provider/registration creation at install, so the SDK must filter. Rejected the
  consumer-only approach.
- **Impact of not doing this.** Developers cannot scope extensibility components; irrelevant
  providers, registrations, and subscriptions continue to be created on every environment,
  and the experience stays inconsistent with Business Configurations.

## Unresolved questions

None. The design decisions are settled: `env` reuses lib-config's shape; events are scoped
per-event with empty providers skipped; an unresolvable environment falls back to apply-to-all
(with a warning); uninstall does not filter; and the shared `env` schema is consolidated in
common-utils as part of this PR.

## Future possibilities

- Apply the same `env` scoping to any future extensibility component, using the shared
  common-utils schema.
- A shared "environment-scoped item" filter helper if more components adopt the pattern.
- If Business Configurations later renders the environment scope visually, webhooks and
  events could adopt the same badge for full UI parity.

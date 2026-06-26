# Migration Skill: Admin UI SDK Improvements

Date: 2026-06-26
Session log: `admin-ui-sdk/v2/customer/custom-grid-columns/session.md`

## Problem

A session run of the `commerce-app-migrate` skill against an Admin UI SDK v1 project
revealed three structural issues and several secondary friction points:

1. **Executor ignored its own CRITICAL rule** — started writing files manually instead of
   running `aio-commerce-lib-app` CLI; user had to interrupt and redirect.
2. **Handler scaffolding structurally unreachable** — the admin-ui-sdk agent's Handler
   Migration section runs at Step 2 (domain analysis), before `src/commerce-backend-ui-2/`
   exists (created by Step 5). Handler files were never written.
3. **runtimeAction always prompted** — even when the value was deducible from existing
   `ext.config.yaml` declarations, the skill asked Q1 with an empty default.

Secondary: scaffolded handlers did not use lib utilities; node runtime version defaulted to
`nodejs:18`; "Safe to delete" section was passive (no removal command); `mesh.json` and
orphaned schema files were not listed.

## Scope

Two files change:

- `plugins/commerce/app-migration/skills/commerce-app-migrate/agents/admin-ui-sdk.md`
- `plugins/commerce/app-migration/skills/commerce-app-migrate/agents/executor.md`

No changes to SKILL.md, analyzer.md, or domain agent dispatch logic.

## Architecture

### Current flow (broken)

```
Step 2: admin-ui-sdk agent
  └─ attempts handler scaffolding   ← src/ does not exist yet

Step 4: npm install
Step 5: aio-commerce-lib-app generate all
  └─ creates src/commerce-backend-ui-2/   ← too late for Step 2 writes
```

### New flow

```
Step 2: admin-ui-sdk agent
  └─ inference only: reads ext.config.yaml, pre-fills runtimeAction defaults
  └─ returns DomainResult JSON (no file writes)

Step 4: aio-commerce-lib-app init   ← replaces Steps 4+5
  └─ installs deps + generates src/ structure

Step 5a: Scaffold handlers (executor)   ← new step
  └─ creates action handler source using lib utilities
  └─ fills package definition in ext.config.yaml if init left it empty
```

The domain agent is a pure analyzer. The executor owns all file writes that require
the generated directory to exist.

---

## Change 1: `admin-ui-sdk.md` — runtimeAction inference

### Scope

All three extension point types that emit an unresolved `runtimeAction` question:

- `adminUi.<entity>.gridColumns.runtimeAction` (order, product, customer)
- `adminUi.<entity>.massActions.<actionId>.runtimeAction` (worker mass actions)
- `adminUi.order.viewButtons.<buttonId>.runtimeAction` (worker view buttons)

### Inference rules

**Grid columns** — no v1 URL to parse. Scan all `ext.config.yaml` files in the project.
For each entity, find a package whose name or action names contain the entity name
(e.g. `customer`) and a grid/column keyword (e.g. `column`, `grid`). Resolve to
`<package>/<action>` format.

**Worker mass actions** — the v1 `path` is a full HTTP URL
(e.g. `https://runtime.adobe.io/api/v1/web/ns/my-package/my-action`). Parse the last
two path segments after `/web/<namespace>/` to extract `<package>/<action>`. Cross-reference
against `ext.config.yaml` to confirm the action is declared. Use as default if confirmed;
fall back to the parsed URL segments if not found in config.

**Worker view buttons** — same inference strategy as worker mass actions.

### Resolution rules

- Exactly one candidate found → use as `default` in the unresolved question
- Multiple candidates found → list them in the prompt, `default: ""`
- No candidate found → `default: ""` (existing behavior)

### Example output

```json
{
  "id": "adminUi.customer.gridColumns.runtimeAction",
  "prompt": "V1 grid columns for customer used API Mesh. V2 requires a runtimeAction. What is the runtime action name?",
  "default": "customer-custom-grid-columns/get-customer-grid-columns"
}
```

### Handler Migration section

Remove the entire `## Handler Migration` section from `admin-ui-sdk.md`.
All handler file writes move to the executor's new Step 5a.

---

## Change 2: `executor.md` — collapse Steps 4+5 into `init`

### Node version detection

Before running init, detect the Node.js runtime to use for scaffolded actions.
Apply rules in order — first match wins:

1. Scan all `ext.config.yaml` files in the project for a `runtime: nodejs:XX` declaration
   in any action definition. Use the value found (e.g. `nodejs:24`).
2. Read `.nvmrc` at the project root. Extract the major version number.
   Format as `nodejs:<major>`.
3. Read `package.json engines.node`. Extract the minimum major version.
   Format as `nodejs:<major>`.
4. Default: `nodejs:24`

Store the result as `detectedNodeRuntime`. Used only in Step 5a scaffolding.

### Steps 4+5 → single `init` command

Remove the separate install step (Step 4) and generate step (Step 5). Replace with one
command using the exec prefix from `packageManager`:

| packageManager | command |
|---|---|
| `npm` | `npx aio-commerce-lib-app init` |
| `pnpm` | `pnpm exec aio-commerce-lib-app init` |
| `yarn` | `yarn exec aio-commerce-lib-app init` |
| `bun` | `bunx aio-commerce-lib-app init` |

The `.env` pre-flight check (copy from `env.dist` if absent, create empty if neither
exists) moves here, before the `init` command runs.

Error handling carries over from the current Step 5: CLI-not-built, schema validation
errors, any other failure → record and report in Step 10.

---

## Change 3: `executor.md` — new Step 5a: Scaffold handlers

Runs immediately after `init` succeeds. Covers all three Admin UI SDK extension point
types that require a handler.

### Grid columns

For each `adminUi.<entity>.gridColumns.runtimeAction` in the assembled config:

1. Parse `<package>/<action>` from the value.
2. Target path: `src/commerce-backend-ui-2/actions/<action>/index.js`
3. If the file already exists: skip.
4. Scaffold:

```javascript
import { parseGridRequest, okGridResponse, errorGridResponse }
  from '@adobe/aio-commerce-lib-admin-ui/grid-columns'

export async function main (params) {
  let request
  try {
    request = parseGridRequest(params)
  } catch (e) {
    return errorGridResponse(400, e.message)
  }
  const data = {}
  for (const id of request.ids) {
    // TODO: fetch column data for id
  }
  return okGridResponse(data)
}
```

5. Add package definition to `src/commerce-backend-ui-2/ext.config.yaml` under
   `runtimeManifest.packages` if not already present:

```yaml
<package>:
  license: Apache-2.0
  actions:
    <action>:
      function: actions/<action>/index.js
      web: 'yes'
      runtime: '<detectedNodeRuntime>'
      inputs:
        LOG_LEVEL: debug
      annotations:
        require-adobe-auth: true
        final: true
```

### Worker mass actions

For each `type: "worker"` mass action in the assembled config:

1. Parse `<package>/<action>` from `runtimeAction`.
2. Locate existing handler: search under `actions/`, `actions-src/`, `src/` for a file
   whose path contains `<action>`.
3. If found: rewrite in place to use lib utilities (preserve business logic, replace
   wire-format boilerplate):

```javascript
import {
  parseMassActionRequest,
  okMassActionResponse,
  massActionErrorResponse,
} from '@adobe/aio-commerce-lib-admin-ui/mass-actions'

export async function main (params) {
  const { gridType, ids } = parseMassActionRequest(params)
  try {
    // existing business logic
    return okMassActionResponse()
  } catch (error) {
    return massActionErrorResponse(500, error.message)
  }
}
```

4. If not found: scaffold a new handler at
   `src/commerce-backend-ui-2/actions/<action>/index.js` using the same shape.

### Worker view buttons

For each `type: "worker"` view button in the assembled config, same lookup and
rewrite/scaffold pattern using:

```javascript
import {
  parseOrderViewButtonRequest,
  okOrderViewButtonResponse,
  orderViewButtonErrorResponse,
} from '@adobe/aio-commerce-lib-admin-ui/order-view-buttons'

export async function main (params) {
  const { id, orderId } = parseOrderViewButtonRequest(params)
  try {
    // existing business logic
    return okOrderViewButtonResponse()
  } catch (error) {
    return orderViewButtonErrorResponse(500, error.message)
  }
}
```

No copyright header on any scaffolded or rewritten file — the header convention varies
by codebase and is the developer's responsibility to add.

---

## Change 4: `executor.md` — "Safe to delete" improvements (Step 10)

Extend the existing "Safe to delete" block to also check for:

- `mesh.json` — if `ProjectSnapshot.hasMeshConfig === true`
- Orphaned JSON schema files: any `.json` file under a v1 admin-ui-sdk path
  (e.g. `admin-ui-sdk/v1/`) not referenced anywhere in the project
  (confirmed with a grep across `src/`, `actions/`, `app.config.yaml`)

For each entry, append a ready-to-copy removal command. Example output:

```
── Safe to delete ──────────────────────────────────────────────
  src/commerce-backend-ui-1/   v1 generated directory; no longer wired up
  mesh.json                    API Mesh config; v2 calls the action directly

  To remove:
    git rm -r src/commerce-backend-ui-1/ mesh.json
```

---

## Import paths

All scaffolded and rewritten handlers use direct lib package paths:

| Extension point | Import path |
|---|---|
| Grid columns | `@adobe/aio-commerce-lib-admin-ui/grid-columns` |
| Mass actions | `@adobe/aio-commerce-lib-admin-ui/mass-actions` |
| Order view buttons | `@adobe/aio-commerce-lib-admin-ui/order-view-buttons` |

The umbrella paths (`@adobe/aio-commerce-sdk/admin-ui/*`) that previously appeared in
the removed Handler Migration section are superseded by these direct lib paths in the
executor's new Step 5a.

---

## Out of scope

- No changes to the overall SKILL.md orchestration or Step numbering (Step 5a is
  internal to the executor)
- No changes to analyzer.md, events.md, webhooks.md, business-config.md
- Deployment guidance (workspace creation, `aio app deploy`) is outside the migration
  skill scope

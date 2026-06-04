---
name: commerce-app-storage
description: >
  Integrate App Builder Database Storage (@adobe/aio-lib-db) into an Adobe
  Commerce app and scaffold a runtime action that reads and writes documents.
  Use when the user wants persistent, queryable storage backing a Commerce app —
  either from a web action (HTTP-invokable) or from an event/webhook handler.
  Requires a base app initialized with commerce-app-init.
license: Apache-2.0
compatibility: >
  Requires Node.js 22+, aio CLI, @adobe/aio-commerce-lib-app, and a provisioned
  workspace database with the App Builder Data Services API subscribed.
  Requires a base app initialized with commerce-app-init.
metadata:
  author: adobe
  sdk-package: "@adobe/aio-lib-db"
  version: "0.0.1"
---

# Add Database Storage to a Commerce App

Integrates App Builder Database Storage into an existing Commerce app and scaffolds a runtime action that uses `@adobe/aio-lib-db` to read and write documents. The library is MongoDB-like: data lives in collections of documents, queried with familiar filters.

The db-access code is identical regardless of action type — what differs is how the action is registered and what its handler returns:

- **Web action** — HTTP-invokable (`web: "yes"`); returns `{ statusCode, body }`.
- **Event/webhook action** — invoked by a Commerce event or webhook; referenced from `app.commerce.config.ts` via `commerce-app-eventing` (`runtimeActions`) or `commerce-app-webhooks` (`runtimeAction`).

## Prerequisites

- Verify `app.commerce.config.ts` exists in the project root. If it doesn't, stop and invoke `commerce-app-init` first.
- The **App Builder Data Services** API must be subscribed in the Developer Console workspace (no special license beyond App Builder). This API authenticates runtime actions to the database service.

## Step 1 — Provision the workspace database

There is a strict one-to-one relationship between an AIO project workspace and a workspace database. Provision it (self-service, no special permissions):

```sh
aio app db provision --region <amer|apac|emea|aus>
```

This provisions the database and writes a `database` entry to `app.config.yaml`. **Note the region** — the library must be initialized in the same region the database was provisioned in.

## Step 2 — Install the library

```sh
npm install @adobe/aio-lib-db
```

## Step 3 — Understand intent

Gather from the user:

- **Action type**: web action or event/webhook action (see the two shapes above).
- **Collection name** and the **operations** needed (insert / find / update / delete).
- **Region**: must match Step 1. Pass it to `init()` or set `AIO_DB_REGION`.

## Step 4 — Register the action

Add the action to a user-defined package in `src/commerce-extensibility-1/ext.config.yaml` (any name except `app-management`, which is reserved). The `include-ims-credentials: true` annotation is **required** — `aio-lib-db` authenticates with the IMS token it injects.

```yaml
# src/commerce-extensibility-1/ext.config.yaml
runtimeManifest:
  packages:
    app-management:
      # ... auto-generated — do not edit
    my-app: # any name except "app-management"
      actions:
        store-record:
          function: actions/store-record/index.js # relative to src/commerce-extensibility-1/
          runtime: nodejs:24
          web: "yes" # "yes" for a web action; "no" for an event/webhook action
          annotations:
            include-ims-credentials: true # REQUIRED for aio-lib-db auth
```

| Field                     | Constraint                                                                        |
| ------------------------- | --------------------------------------------------------------------------------- |
| Package name              | Lowercase alphanumeric + hyphens; never `app-management` (reserved)               |
| `function`                | Path relative to `src/commerce-extensibility-1/` — not `src/...` or root-relative |
| `include-ims-credentials` | Must be `true` — without it `init()` has no IMS token and the connection fails    |
| `web`                     | `"yes"` for HTTP-invokable web actions; `"no"` for event/webhook handlers         |
| Collection name           | Non-empty string; created on first write if it doesn't exist                      |
| Region                    | Must match the provisioned region (`amer` \| `apac` \| `emea` \| `aus`)           |

## Step 5 — Implement the handler

Every handler follows the same lifecycle: generate token → `init` → `connect` → use a collection → **always `close` in `finally`**.

```ts
// Web action — src/commerce-extensibility-1/actions/store-record/index.ts
import { Core } from "@adobe/aio-sdk";
import { init as initDb } from "@adobe/aio-lib-db";

export async function main(params: Record<string, unknown>) {
  let client;
  try {
    const token = await Core.AuthClient.generateAccessToken(params); // IMS token
    const db = await initDb({ token: token.access_token, region: "emea" }); // region must match provisioning
    client = await db.connect();
    const records = client.collection("records");

    const result = await records.insertOne({
      ...(params.document as object),
      createdAt: new Date().toISOString(),
    });
    return { statusCode: 200, body: { ok: true, result } };
  } catch (error: any) {
    return {
      statusCode: error.statusCode || 500,
      body: { error: error.message },
    };
  } finally {
    if (client) await client.close(); // always close — avoids connection leaks
  }
}
```

For an **event/webhook action** the only differences are `web: "no"` in registration and that the payload arrives in `params.data`:

```ts
// Event/webhook handler — same init/connect/close lifecycle
export async function main(params: Record<string, unknown>) {
  const data = params.data as Record<string, unknown>;
  let client;
  try {
    const token = await Core.AuthClient.generateAccessToken(params);
    const db = await initDb({ token: token.access_token, region: "emea" });
    client = await db.connect();
    await client
      .collection("orders")
      .insertOne({ orderId: data.order_id, receivedAt: new Date() });
    return { statusCode: 200, body: { processed: true } };
  } finally {
    if (client) await client.close();
  }
}
```

See [assets/db-action.ts](assets/db-action.ts) for the full annotated reference covering all CRUD operations and cursor iteration.

## Step 6 — Set up collections and indexes on install

For an App Management app, create collections and indexes with a **custom installation step** — a script that runs once when the app is installed from the Commerce Admin, and can be reversed on uninstall. Prefer this over creating them ad-hoc on the first request.

Author the step with `defineCustomInstallationStep` (an `install` handler plus an optional `uninstall`). Inside it, generate the IMS token from **`context.params`** — _not_ `config` — then follow the same init → connect → `close` lifecycle as Step 5, and call `createIndex` **on the collection object**:

```ts
// ./scripts/setup-database.ts — referenced from config as ./scripts/setup-database.js
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
import { Core } from "@adobe/aio-sdk";
import { init as initDb } from "@adobe/aio-lib-db";

export default defineCustomInstallationStep({
  install: async (config, context) => {
    let client;
    try {
      // context.params carries the injected IMS credentials — NOT config.
      const token = await Core.AuthClient.generateAccessToken(context.params);
      const db = await initDb({ token: token.access_token, region: "emea" }); // region must match provisioning
      client = await db.connect();

      const orders = client.collection("held_orders"); // get the collection object first
      await orders.createIndex({ order_id: 1 }, { unique: true }); // createIndex on the collection, not a name string
      return { status: "success" };
    } finally {
      if (client) await client.close(); // always close — avoids connection leaks
    }
  },
  uninstall: async (config, context) => {
    let client;
    try {
      const token = await Core.AuthClient.generateAccessToken(context.params);
      const db = await initDb({ token: token.access_token, region: "emea" });
      client = await db.connect();
      await client.collection("held_orders").drop();
    } finally {
      if (client) await client.close();
    }
  },
});
```

Register the step in `app.commerce.config.ts` under `installation.customInstallationSteps`. The `script` path points at the compiled `.js` output:

```ts
// app.commerce.config.ts
installation: {
  customInstallationSteps: [
    {
      script: "./scripts/setup-database.js", // compiled output of setup-database.ts
      name: "Set up held-orders collection",
      description: "Creates the held_orders collection and a unique index on order_id",
    },
  ],
},
```

| Field         | Constraint                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| `script`      | Path relative to the project root; must end in `.js` (the compiled step)     |
| `name`        | Non-empty string, ≤ 255 characters; **unique** across all installation steps |
| `description` | Non-empty string, ≤ 255 characters                                           |

See [assets/setup-database.ts](assets/setup-database.ts) for the full annotated install/uninstall reference.

## Step 7 — Validate

```sh
aio app build
```

A build failure points directly to the offending config field. To exercise the action against the real database, deploy and invoke it (`aio app deploy`).

## Best practices

- **Always close connections** in a `finally` block — leaked connections exhaust resources.
- **Match the region** between provisioning and `init()`; a mismatch fails the connection silently from the caller's view.
- **Use projections** (`.project({ field: 1 })`) and **indexes** (`createIndex`) for frequently queried fields; index fields must total ≤ 2048 bytes.
- **Iterate large result sets with cursors** (`for await (const doc of collection.find(...))`) instead of `toArray()` to bound memory.
- **Don't hardcode the region or secrets** — prefer `AIO_DB_REGION` and the injected IMS token over inline values.
- **Set up collections and indexes during installation** with a custom installation step (`defineCustomInstallationStep`, see Step 6) rather than ad-hoc on the first request — it runs once when the app is installed from the Commerce Admin and is reversible on uninstall. A generic App Builder `post-app-deploy` hook is only an alternative when the app is not installed through App Management.

## Common Issues

- **Connection fails despite a valid token**: the action is missing `include-ims-credentials: true`, or the **App Builder Data Services** API is not subscribed in the workspace.
- **Connection fails after a region change**: the library region doesn't match where the database was provisioned. To move regions you must `aio app db delete`, update the region, then re-provision.
- **Querying by `_id` from a string returns nothing**: convert it first — `new ObjectId(idString)` from `bson`. A raw string never matches the stored `ObjectId`.
- **`DbError` vs unexpected error**: errors thrown by the service have `name === "DbError"`; branch on it to separate database failures from application bugs.
- **Auth fails inside an installation step**: the token must be generated from `context.params` (which carries the injected IMS credentials), not from `config`. `config` is the app configuration and holds no credentials.
- **`createIndex` errors or has no effect**: it must be called on a collection object (`client.collection("name").createIndex({ field: 1 })`), not with a collection-name string. Get the collection first, then call `createIndex` on it.

## Quality Bar

- `aio app build` completes without errors
- The action closes the client in a `finally` block and initializes the library in the provisioned region

## Chaining

- **Wire the action to an event** — invoke `commerce-app-eventing` and reference this action in an event's `runtimeActions`.
- **Wire the action to a webhook** — invoke `commerce-app-webhooks` and reference this action via `runtimeAction`.

## References

- [assets/db-action.ts](assets/db-action.ts) — Full annotated handler: init/connect, CRUD, cursor iteration, and the close lifecycle
- [assets/setup-database.ts](assets/setup-database.ts) — Full annotated custom installation step: install creates a collection and a unique index, uninstall drops it, with the `context.params` and `createIndex`-on-collection patterns

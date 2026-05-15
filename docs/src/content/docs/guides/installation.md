---
title: Installation
description: Choose between the meta-package and individual packages, and understand peer dependency requirements.
---

## Meta-package vs individual packages

### Meta-package (`@adobe/aio-commerce-sdk`)

The meta-package re-exports everything from all individual libraries through a single import:

```shell
npm install @adobe/aio-commerce-sdk
```

Use the meta-package when:

- You are getting started and want the simplest setup
- Your action uses multiple SDK libraries
- Bundle size is not a primary concern (App Builder runtime actions run server-side)

### Individual packages

Each library is also published independently under `@adobe/aio-commerce-lib-*`:

```shell
npm install @adobe/aio-commerce-lib-auth
npm install @adobe/aio-commerce-lib-api
npm install @adobe/aio-commerce-lib-app
npm install @adobe/aio-commerce-lib-config
npm install @adobe/aio-commerce-lib-core
npm install @adobe/aio-commerce-lib-events
npm install @adobe/aio-commerce-lib-webhooks
```

Use individual packages when:

- Your action only needs one or two libraries
- You want the smallest possible deployment bundle
- You prefer explicit dependency management

All packages ship both ESM and CJS builds and are fully tree-shakeable.

## Peer dependencies

The `@adobe/aio-commerce-lib-app` package generates runtime actions that depend on `@adobe/aio-commerce-sdk` at runtime. Install it alongside `aio-commerce-lib-app`:

```shell
npm install @adobe/aio-commerce-lib-app @adobe/aio-commerce-sdk
```

The `@adobe/aio-commerce-lib-config` library depends on `@adobe/aio-lib-state` and `@adobe/aio-lib-files` for persistent storage. These are peer dependencies managed by the Adobe I/O platform and do not need to be installed manually in most App Builder projects.

## Node.js version

All packages require **Node.js 20 or later**.

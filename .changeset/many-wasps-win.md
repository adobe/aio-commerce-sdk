---
"@adobe/aio-commerce-lib-app": patch
---

Admin UI apps now use the correct `NODE_ENV` on the first `aio app run`, `aio app dev` and `aio app build`, and hook failures stop the command. The generated `ext.config.yaml` hooks now point to generated JavaScript files, which the `postinstall` hook updates automatically.

---
"@adobe/aio-commerce-lib-app": patch
---

Apps now use the correct `NODE_ENV` on every `aio app run`, `aio app dev` and `aio app build`, and a failing hook stops the command. The hooks in generated `ext.config.yaml` files now point to generated JavaScript files.

---
"@adobe/aio-commerce-lib-app": patch
---

Fix hook and post-install scripts failing to resolve CLI binaries under pnpm and yarn. Generated commands now use `pnpm exec` / `yarn exec` instead of `pnpx` / `yarn dlx`, which bypass local `node_modules/.bin` resolution.

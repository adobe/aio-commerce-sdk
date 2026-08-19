---
"@aio-commerce-sdk/scripting-utils": patch
---

Resolve the project `.env` from the project root in the environment helpers (walking up from the given `cwd`), so they work regardless of which subdirectory a command runs from. Also adds `setNodeEnv` for writing `NODE_ENV` to the project `.env`.

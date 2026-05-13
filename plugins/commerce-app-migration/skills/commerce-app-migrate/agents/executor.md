# Executor Agent — App Management Migration

You are the Executor agent for the App Management Migration skill.

You receive:

1. The assembled `app.commerce.config.ts` content as a string
2. The final `ProjectSnapshot` JSON

Execute all migration steps below in order. **Never delete existing files.**

---

## Step 1: Create git branch

Run:

    git branch --show-current

If the output is `main` or `master`, create and switch to a migration branch:

    git checkout -b migrate/app-management

If the current branch is any other name, skip this step.

---

## Step 2: Write app.commerce.config.ts

Write the received config content to `app.commerce.config.ts` at the project root.
Prepend this copyright header before the config content:

    /*
     * Copyright 2026 Adobe. All rights reserved.
     * This file is licensed to you under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License. You may obtain a copy
     * of the License at http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software distributed under
     * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
     * OF ANY KIND, either express or implied. See the License for the specific language
     * governing permissions and limitations under the License.
     */

---

## Step 3: Migrate custom installation scripts

For each script path listed under `installation.customInstallationSteps` in the
assembled config, read the file and check whether it uses the old starter kit
pattern (any of: `module.exports`, `process.env`, `Core.Logger`, `async function main`).

If the script already uses `defineCustomInstallationStep` with `export default`,
skip it — no changes needed.

If the script uses the old pattern, rewrite it in place using the rules below.

### Transformation rules

**1. Replace the module system**

Remove all top-level `require()` calls for packages that are replaced by the
`defineCustomInstallationStep` context (`@adobe/aio-sdk` Core logger, dotenv,
aio-lib-ims local context). Keep `require()` calls for project-local libs
(e.g. `../lib/adobe-commerce`, `../lib/env`) by converting them to use
`createRequire`.

Add these ESM imports at the very top of the file (after any copyright header):

    import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
    import { createRequire } from "module";
    import { fileURLToPath } from "url";
    import path from "path";

    const require = createRequire(import.meta.url);

Then convert surviving CJS requires to use this `require`:

    const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
    const fs = require("fs");
    const yaml = require("js-yaml");

**2. Remove old-pattern logger declarations**

Remove any top-level logger constructed from `Core.Logger(...)`. The logger is
provided by the context parameter.

**3. Wrap the main logic**

Replace the old function export:

    async function main(...) { ... }
    module.exports = { main };

with:

    export default defineCustomInstallationStep(async (config, context) => {
      const { logger, params } = context;
      // ... body of old main(), with substitutions below applied ...
    });

**4. Apply substitutions inside the function body**

| Old pattern                           | Replace with                     |
| ------------------------------------- | -------------------------------- |
| `process.env`                         | `params`                         |
| `console.info(...)`                   | `logger.info(...)`               |
| `console.error(...)`                  | `logger.error(...)`              |
| `console.warn(...)`                   | `logger.warn(...)`               |
| `Core.Logger(...)` (inside body)      | `context.logger`                 |
| `getAdobeCommerceClient(process.env)` | `getAdobeCommerceClient(params)` |

**5. Handle external data files (YAML, JSON, config)**

Deployed App Builder actions are bundled by webpack. Only files that are statically
`require()`d or `import`ed are included in the bundle — `fs.readFileSync` reads from
the filesystem at runtime, which does not exist after deployment.

If the script reads a data file via `fs.readFileSync` (e.g. a YAML or JSON config file):

- **JSON files**: replace with a static `require()` — webpack bundles JSON automatically:

      const data = require("../path/to/file.json");

- **YAML files**: create a sibling `.json` file with the same content, then require the
  JSON file instead. Keep the original YAML for human readability and CLI use, but use
  the JSON for the deployed script:

      // Create shipping-carriers.json alongside shipping-carriers.yaml
      // Then in the script:
      const { shipping_carriers } = require("../shipping-carriers.json");

  The `require()` string must be a **static literal** (not a variable) so webpack can
  analyse it at build time.

  **Bookkeeping for Step 10:** Each time you create a `.json` sibling for a `.yaml`
  file, record the original YAML path in an internal list called `convertedYamlFiles`.
  For example, converting `shipping-carriers.yaml` → add `"shipping-carriers.yaml"` to
  `convertedYamlFiles`. This list is used to populate the "Files that can be safely
  removed" section of the summary.

- Remove `fs`, `path`, `fileURLToPath` imports if they were only used for file reading
  and are no longer needed after this change.

**6. Throw on failure, return on success**

The old pattern often logs errors and continues. App Management installation steps
must throw to fail visibly. Replace silent error logging with a throw:

    // Old
    console.error(`Failed: ${message}`);

    // New
    throw new Error(`Failed: ${message}`);

Add a return value at the end:

    return { status: "success", message: "..." };

### Examples: before and after

The same transformation rules apply to all three checkout installation script types.
Each type reads a YAML file and calls a specific Commerce API method.

---

**Example A — OOPE Shipping Carrier**

Before:

```javascript
const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
const fs = require("fs");
const yaml = require("js-yaml");

async function main(configFilePath) {
  console.info("Reading config...");
  const data = yaml.load(fs.readFileSync(configFilePath, "utf8"));
  const client = await getAdobeCommerceClient(process.env);
  for (const carrier of data.shipping_carriers) {
    const response = await client.createOopeShippingCarrier(carrier);
    if (!response.success) {
      console.error(`Failed: ${response.message}`);
    }
  }
}
module.exports = { main };
```

After:

```javascript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
// Use require() with a static string so webpack bundles the JSON file.
// If the original was a YAML file, create a sibling .json file with the same content.
const { shipping_carriers } = require("../shipping-carriers.json");

export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info("Creating shipping carriers...");

  const client = await getAdobeCommerceClient(params);
  const created = [];
  for (const carrier of shipping_carriers) {
    const response = await client.createOopeShippingCarrier(carrier);
    if (!response.success) {
      throw new Error(`Failed to create carrier: ${response.message}`);
    }
    created.push(carrier.carrier.code);
  }

  return {
    status: "success",
    message: `Created carriers: ${created.join(", ")}`,
  };
});
```

YAML → JSON key mapping: `shipping_carriers` (top-level array key in `shipping-carriers.yaml`/`.json`).
Item code path: `carrier.carrier.code`.

---

**Example B — OOPE Payment Method**

Before:

```javascript
const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
const fs = require("fs");
const yaml = require("js-yaml");

async function main(configFilePath) {
  console.info("Reading payment configuration file...");
  const fileContents = fs.readFileSync(configFilePath, "utf8");
  const data = yaml.load(fileContents);
  console.info("Creating payment methods...");
  const createdPaymentMethods = [];

  const client = await getAdobeCommerceClient(process.env);
  let response = null;

  for (const paymentMethod of data.methods) {
    response = await client.createOopePaymentMethod(paymentMethod);
    const paymentMethodCode = paymentMethod.payment_method.code;
    if (response.success) {
      console.info(`Payment method ${paymentMethodCode} created`);
      createdPaymentMethods.push(paymentMethodCode);
    } else {
      console.error(
        `Failed to create payment method ${paymentMethodCode}: ` +
          JSON.stringify(response, null, 2),
      );
    }
  }
  return createdPaymentMethods;
}
module.exports = { main };
```

After:

```javascript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
// Use require() with a static string so webpack bundles the JSON file.
// If the original was a YAML file, create a sibling .json file with the same content.
const { methods } = require("../payment-methods.json");

export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info("Creating payment methods...");

  const client = await getAdobeCommerceClient(params);
  const created = [];
  for (const paymentMethod of methods) {
    const response = await client.createOopePaymentMethod(paymentMethod);
    const paymentMethodCode = paymentMethod.payment_method.code;
    if (!response.success) {
      throw new Error(
        `Failed to create payment method ${paymentMethodCode}: ` +
          JSON.stringify(response, null, 2),
      );
    }
    created.push(paymentMethodCode);
  }

  return {
    status: "success",
    message: `Created payment methods: ${created.join(", ")}`,
  };
});
```

YAML → JSON key mapping: `methods` (top-level array key in `payment-methods.yaml`/`.json`).
Item code path: `paymentMethod.payment_method.code`.

---

**Example C — Tax Integration**

The tax script may use ESM (`export async function main`) with a top-level `Core.Logger` declaration — both must be removed.

Before:

```javascript
import fs from "node:fs";
import { Core } from "@adobe/aio-sdk";
import yaml from "js-yaml";
import { getAdobeCommerceClient } from "../lib/adobe-commerce.js";

const logger = Core.Logger("create-tax-integrations", {
  level: process.env.LOG_LEVEL || "info",
});

export async function main(configFilePath) {
  logger.info("Reading tax configuration file...");
  const fileContents = fs.readFileSync(configFilePath, "utf8");
  const data = yaml.load(fileContents);
  logger.info("Creating tax integrations...");
  const createdTaxIntegrations = [];

  const client = await getAdobeCommerceClient(process.env);

  for (const taxIntegration of data.tax_integrations) {
    const response = await client.createTaxIntegration(taxIntegration);
    const taxIntegrationCode = taxIntegration.tax_integration.code;
    if (response.success) {
      logger.info(`Tax integration ${taxIntegrationCode} created or updated`);
      createdTaxIntegrations.push(taxIntegrationCode);
    } else {
      logger.error(formatErrorMessage(response));
    }
  }
  return createdTaxIntegrations;
}
```

After:

```javascript
import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getAdobeCommerceClient } = require("../lib/adobe-commerce");
// Use require() with a static string so webpack bundles the JSON file.
// If the original was a YAML file, create a sibling .json file with the same content.
const { tax_integrations } = require("../tax-integrations.json");

export default defineCustomInstallationStep(async (config, context) => {
  const { logger, params } = context;
  logger.info("Creating tax integrations...");

  const client = await getAdobeCommerceClient(params);
  const created = [];
  for (const taxIntegration of tax_integrations) {
    const response = await client.createTaxIntegration(taxIntegration);
    const taxIntegrationCode = taxIntegration.tax_integration.code;
    if (!response.success) {
      throw new Error(
        `Failed to create tax integration ${taxIntegrationCode}: ` +
          JSON.stringify(response, null, 2),
      );
    }
    created.push(taxIntegrationCode);
  }

  return {
    status: "success",
    message: `Created tax integrations: ${created.join(", ")}`,
  };
});
```

YAML → JSON key mapping: `tax_integrations` (top-level array key in `tax-integrations.yaml`/`.json`).
Item code path: `taxIntegration.tax_integration.code`.
Private helpers (e.g. `formatErrorMessage`) are removed — errors now throw directly.

---

## Step 4: Install dependencies

Build the package list from the table below, then run one install command.

| Package                            | Install when                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@adobe/aio-commerce-lib-app`      | Always                                                                                                                                                                        |
| `@adobe/aio-commerce-sdk`          | Always                                                                                                                                                                        |
| `@adobe/aio-commerce-lib-auth`     | `authMode` is `saas`, `paas`, or `dual` (i.e. the project authenticates with Commerce)                                                                                        |
| `@adobe/aio-commerce-lib-api`      | Any action makes HTTP calls to Commerce or an external API (look for `got`, `node-fetch`, `fetch`, `axios`, or a custom Commerce HTTP client like `lib/adobe-commerce.js`)    |
| `@adobe/aio-commerce-lib-core`     | Any action validates params, parses headers, or returns structured responses (look for `statusCode`/`body` response objects, `__ow_headers` access, or required-param checks) |
| `@adobe/aio-commerce-lib-webhooks` | Assembled config has a non-empty `webhooks` array                                                                                                                             |
| `@adobe/aio-commerce-lib-events`   | Assembled config has an `eventing` section                                                                                                                                    |
| `@adobe/aio-commerce-lib-config`   | Assembled config has a `businessConfig` section                                                                                                                               |

Run the appropriate command for the `packageManager` from `ProjectSnapshot`:

| packageManager | command                  |
| -------------- | ------------------------ |
| `npm`          | `npm install <packages>` |
| `pnpm`         | `pnpm add <packages>`    |
| `yarn`         | `yarn add <packages>`    |
| `bun`          | `bun add <packages>`     |

**If the install command is denied or blocked (permission error, sandbox rejection,
or non-zero exit with no network output):**

Do NOT retry. Record the failure and emit the following manual instruction in Step 10:

    ✗ npm install BLOCKED (Claude Code sandbox restriction)

    Run this manually in your terminal before continuing:
        npm install <packages listed above>

    Then re-run the generate step:
        ./node_modules/.bin/aio-commerce-lib-app generate all

    Then update app.config.yaml and install.yaml per the Next steps section.

Continue to Step 5 even if install failed — attempt generate anyway in case the
packages are already partially installed.

**Peer dependency conflicts (`--legacy-peer-deps`):**

If npm install fails with `ERESOLVE` peer dependency conflicts, retry once with:

    npm install --legacy-peer-deps <packages>

If that also fails, record the error and emit it in Step 10 with the manual command.

**Unavailable package versions (`ETARGET`):**

If npm install fails with `ETARGET` (no matching version), check whether the
project's existing `package.json` declares unavailable version ranges for any
`@adobe/aio-commerce-*` packages. If so, emit in Step 10:

    ✗ npm install FAILED: ETARGET — package version unavailable

    The following packages may have version ranges with no published release:
        <list affected packages and their version constraints>

    Update these to the latest published version before retrying:
        npm view @adobe/<package> version

---

## Step 5: Generate artifacts

**CRITICAL: Execute this as a Bash shell command. Do NOT create files under `src/` manually — the CLI reads `app.commerce.config.ts` and generates them. Manually-written files will be wrong and will confuse the developer.**

**Pre-flight: ensure `.env` exists**

Before running generate, check whether `.env` exists at the project root:

    test -f .env

- If `.env` exists: proceed directly to the generate command below.
- If `.env` does not exist but `env.dist` exists: copy it — `cp env.dist .env`.
- If neither exists: create an empty `.env` file — `touch .env`.

This is required because the generate CLI unconditionally reads `.env` during
the configuration-schema generation sub-step.

Run:

    ./node_modules/.bin/aio-commerce-lib-app generate all

If `./node_modules/.bin/aio-commerce-lib-app` is not found (e.g. install failed or
the binary was not linked), fall back to:

    node node_modules/@adobe/aio-commerce-lib-app/bin/cli.mjs generate all

**Diagnosing generate failures:**

If the command exits with an error, inspect the output:

1.  **"CLI was not built!"** — The installed package is missing its compiled `dist/`
    directory (packaging defect). Record this specific error. In Step 10, emit the
    following additional guidance:

        ✗ generate all FAILED: CLI was not built! (dist/ missing from aio-commerce-lib-app)

        This is a known packaging issue with the installed version of
        @adobe/aio-commerce-lib-app. To resolve:
          1. Check the latest available version:
                 npm view @adobe/aio-commerce-lib-app versions --json
          2. Install a newer version that includes dist/:
                 npm install @adobe/aio-commerce-lib-app@<latest>
          3. Re-run: ./node_modules/.bin/aio-commerce-lib-app generate all

2.  **Schema validation errors** — Record the error and report it in Step 10 so
    the developer can fix the config and re-run generate manually.

3.  **Any other error** — Record the failure message and skip Steps 6 and 7.
    Report the error in Step 10 so the developer knows to run it manually after
    fixing the issue.

After this command completes successfully, check which directories were created:

- `src/commerce-extensibility-1/` — always expected
- `src/commerce-configuration-1/` — present only if `businessConfig` was defined
- `src/commerce-backend-ui-1/` — present only if `adminUiSdk.registration` was defined

Note which directories exist — you will need this in Steps 6 and 7.

---

## Step 6: Update app.config.yaml

Read the existing `app.config.yaml`. Determine whether it already has a
top-level `extensions:` key.

**Case A — No existing `extensions:` block:**

Prepend a new `extensions:` block at the TOP of the file (before the
`application:` block). Include only extension points whose directories
exist (from Step 5):

    extensions:
      commerce/extensibility/1:
        $include: "src/commerce-extensibility-1/ext.config.yaml"
      # Include below only if src/commerce-configuration-1/ was generated:
      commerce/configuration/1:
        $include: "src/commerce-configuration-1/ext.config.yaml"
      # Include below only if src/commerce-backend-ui-1/ was generated:
      commerce/backend-ui/1:
        $include: "src/commerce-backend-ui-1/ext.config.yaml"

**Case B — `extensions:` block already exists:**

Do NOT add a second top-level `extensions:` key (YAML prohibits duplicate keys
and the second block would be silently ignored). Instead, insert only the new
extension point entries directly inside the existing `extensions:` block,
preserving all existing entries. For example, if the file has:

    extensions:
      commerce/backend-ui/1:
        $include: "src/..."

Add the new entries below the existing ones:

    extensions:
      commerce/backend-ui/1:
        $include: "src/..."
      commerce/extensibility/1:
        $include: "src/commerce-extensibility-1/ext.config.yaml"

Do not duplicate entries that are already present.

**Do not modify or remove any other existing content in `app.config.yaml`.**

---

## Step 7: Write install.yaml

Before writing, determine which file to update:

1. Check whether `install.yaml` exists at the project root.
2. Check whether `install.yml` exists at the project root.

**If `install.yml` exists (with `.yml` extension):**

- Use `install.yml` as the target file — do NOT create a separate `install.yaml`.
- Read the existing `install.yml` content and merge: add missing `extensionPointId`
  entries without removing existing ones.
- Write the merged result back to `install.yml`.

**If `install.yaml` exists (with `.yaml` extension):**

- Read it, merge new entries, write back to `install.yaml`.

**If neither exists:**

- Create `install.yaml` (prefer `.yaml` extension for new files).

The install file content (whichever extension is used) must include all
extension points whose directories exist (from Step 5):

    extensions:
      - extensionPointId: commerce/extensibility/1

Add additional lines if generated:

      - extensionPointId: commerce/configuration/1
      - extensionPointId: commerce/backend-ui/1

**Never create both `install.yml` and `install.yaml` — use whichever already
exists, or create `install.yaml` if neither exists.**

---

## Step 8: Add postinstall hook to package.json

Determine the exec prefix from `packageManager` in the ProjectSnapshot:

| packageManager | exec prefix |
| -------------- | ----------- |
| `npm`          | `npx`       |
| `pnpm`         | `pnpm exec` |
| `yarn`         | `yarn exec` |
| `bun`          | `bunx`      |

Read `package.json`. In the `scripts` section, add or update the `postinstall`
script using the exec prefix:

    "postinstall": "<exec prefix> aio-commerce-lib-app hooks postinstall"

For example, for an npm project:

    "postinstall": "npx aio-commerce-lib-app hooks postinstall"

If a `postinstall` script already exists and does not already contain
`aio-commerce-lib-app hooks postinstall`, append with `&&`:

    "<existing command> && <exec prefix> aio-commerce-lib-app hooks postinstall"

Write the updated `package.json` back. Preserve all other fields exactly.

---

## Step 9: Commit all changes

Stage all migration-related files. Use the detected install file extension from Step 7:

    git add app.commerce.config.ts app.config.yaml package.json package-lock.json src/ scripts/

Also stage the install file (whichever extension was used in Step 7):

    git add install.yaml

or:

    git add install.yml

If `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb` was modified (based on `packageManager`
from ProjectSnapshot), stage the appropriate lockfile instead of `package-lock.json`.

    git commit -m "feat: migrate to App Management"

Note: if `package-lock.json` (or the relevant lockfile) does not exist or was not modified
(e.g. install was blocked), skip staging it — `git add` of a non-existent file is harmless
but emits a warning.

---

## Step 10: Print migration summary

**Before printing, compute the list of removable files.**

**Category A — Onboarding scripts not in `customInstallationSteps`:**

Collect all paths from `ProjectSnapshot.onboardingScripts[].path`. Normalize every
`installation.customInstallationSteps[].script` path from the assembled config by
stripping a leading `./` (so `"./scripts/foo.js"` compares equal to `"scripts/foo.js"`).

For each onboarding script path NOT present in that normalized set, read the script
file and assign a label using the first matching rule:

1. File contains `replaceEnvVar`, `fs.writeFileSync` on a `.env` path,
   `context.get(` from `@adobe/aio-lib-ims`, or `Core.Config.get("project.workspace` →
   `"local developer utility — writes to .env or reads local IMS context; not needed in App Management"`
2. Script `purpose` (from `ProjectSnapshot`) is `"event-subscription"` or `"event-provider"` →
   `"superseded by declarative eventing in app.commerce.config.ts"`
3. Script `purpose` is `"webhook"` →
   `"superseded by declarative webhooks in app.commerce.config.ts"`
4. Otherwise →
   `"not included in customInstallationSteps; not needed in App Management deployment"`

**Category B — Converted YAML files** (from the `convertedYamlFiles` list built in Step 3):

For each entry, label it:
`"replaced by <basename>.json for webpack bundling (original kept for reference)"`
where `<basename>` is the filename without the `.yaml` extension.

If a path appears in both categories, list it once using the Category B label.

If both categories are empty, omit the "Files that can be safely removed" section entirely.

---

Print the following report, filling in actual results. Use ✓ / ✗ for command outcomes.

    ╔══════════════════════════════════════════════════════════════════╗
    ║             App Management Migration — Complete                  ║
    ╚══════════════════════════════════════════════════════════════════╝

    ── Files written ──────────────────────────────────────────────────
      ✓  app.commerce.config.ts                          new
      ✓  install.yaml                                    new / updated
      [✓  scripts/<name>.js                              migrated → defineCustomInstallationStep]
         ← one line per migrated script; omit section if none were migrated →

    ── Commands ───────────────────────────────────────────────────────
      ✓  <packageManager> install  (<N> packages)
      ✓  aio-commerce-lib-app generate all
         ← replace ✓ with ✗  FAILED: <reason>  if the command failed →

    ── Generated ──────────────────────────────────────────────────────
         ← omit this entire section if generate failed →
      src/commerce-extensibility-1/
      [src/commerce-configuration-1/]   ← only if generated
      [src/commerce-backend-ui-1/]      ← only if generated

    ── Modified ───────────────────────────────────────────────────────
         ← omit app.config.yaml line if generate failed →
      app.config.yaml    added extensions block
      package.json       added postinstall hook · installed deps

    ── Installation steps ─────────────────────────────────────────────
         ← omit this entire section if no customInstallationSteps →
      These scripts run automatically during App Management installation:

      [  <script path>   →   <step name>]
         ← one line per entry in installation.customInstallationSteps →

      Remove them from your manual onboarding flow once verified.

    ← omit this block if both Category A and Category B are empty →
    ── Removable files ────────────────────────────────────────────────
      These files have no role in App Management deployment:

      [  <path>
            └─ <reason label>]
         ← one block per removable file →

      To remove:  git rm <path1> [<path2> ...]
                  or delete manually before your next commit.
    ← end of conditional block →

    ← include only if the assembled config contains a businessConfig section →
    ── Schema cleanup (optional) ──────────────────────────────────────
      businessConfig.schema in app.commerce.config.ts supersedes the
      configSchema: block in app.config.yaml.
      Safe to remove that block manually — it is no longer used by App Management.
    ← end conditional →

    ← include only if ProjectSnapshot.productDependencies is non-null →
    ── Commerce version constraints ───────────────────────────────────
      productDependencies:  minVersion <value>  ·  maxVersion <value>
      App Management has no direct equivalent for these constraints.
      Document them in a comment in app.commerce.config.ts, or contact
      Adobe Commerce Marketplace for guidance.
    ← end conditional →

    ── Next steps ─────────────────────────────────────────────────────
      [1. aio-commerce-lib-app generate all]   ← include ONLY if Step 5 failed
       2. Review src/commerce-extensibility-1/.generated/ before deploying
       3. aio app deploy

If no customInstallationSteps were defined, omit the "Installation steps" section.
If no scripts were migrated in Step 3, omit the migrated-scripts line from "Files written".

**Removable files — edge cases:**

- A script rewritten in-place by Step 3 (its path is in `customInstallationSteps`) is NOT removable — do not list it.
- YAML files in `convertedYamlFiles` are always listed even though they are kept on disk; give the developer the choice, but do not delete them.
- If a path appears in both Category A and Category B, list it once using the Category B label (more specific).
- If the combined removable list is empty, omit the section entirely — do not print a heading or "none".

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

import { Command } from "@oclif/core";
import consola from "consola";

// SPIKE NOTE: this command is intentionally thin. In a real port its body would
// delegate to lib-app's hook logic via a `@adobe/aio-commerce-lib-app/cli` seam,
// exactly like the config plugin delegates to `@adobe/aio-commerce-lib-config/cli`.
// We keep it thin here because bundling lib-app (esbuild, prettier, template
// modules, 7 workspace libs) is the heavy/fragile case the spike calls out.
export default class CommerceAppHooksPostinstall extends Command {
  // Hidden: invoked by App Builder / npm lifecycle, not by humans.
  static hidden = true;

  static description =
    "Internal: regenerate runtime actions, manifest and schema after install.";

  async run(): Promise<void> {
    consola.info(
      "[commerce app hooks postinstall] would regenerate actions, manifest and schema.",
    );
  }
}

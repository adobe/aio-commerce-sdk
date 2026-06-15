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

import { Command, Flags } from "@oclif/core";
import consola from "consola";

// SPIKE NOTE: thin on purpose (see postinstall.ts). The real body delegates to
// lib-app's pre-app-build hook via a `@adobe/aio-commerce-lib-app/cli` seam.
export default class CommerceAppHooksPreAppBuild extends Command {
  // Hidden: invoked by `aio app build`, not by humans.
  static hidden = true;

  static description =
    "Internal: prepare runtime artifacts before an App Builder build.";

  static flags = {
    // App Builder passes the extension point via the EXTENSION env var; expose
    // it as a flag too so the command is usable on its own.
    extension: Flags.string({
      description: "Extension point id to prepare.",
      env: "EXTENSION",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CommerceAppHooksPreAppBuild);
    consola.info(
      `[commerce app hooks pre-app-build] would prepare artifacts for "${flags.extension}".`,
    );
  }
}

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

import { resolve } from "node:path";

import { runEncryptionSetup } from "@adobe/aio-commerce-lib-config/cli";
import { Command, Flags } from "@oclif/core";

export default class CommerceConfigEncryptionSetup extends Command {
  static description =
    "Ensure an encryption key is configured for Commerce config password fields.";

  static examples = ["<%= config.bin %> <%= command.id %>"];

  static flags = {
    env: Flags.string({
      description: "Path to the .env file to read/update.",
      default: ".env",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CommerceConfigEncryptionSetup);
    await runEncryptionSetup(resolve(process.cwd(), flags.env));
  }
}

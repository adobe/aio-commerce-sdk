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

/**
 * Command logic surfaced for `aio` CLI plugins.
 *
 * This entrypoint exists so a CLI plugin can act as a thin orchestrator
 * (parse args, resolve paths) while the actual command logic stays in this
 * package. It is the concrete seam referenced by the CLI spike as "option A".
 *
 * @packageDocumentation
 */

export { run as runEncryptionSetup } from "#commands/encryption/setup/main";
export { run as runEncryptionValidate } from "#commands/encryption/validate/main";

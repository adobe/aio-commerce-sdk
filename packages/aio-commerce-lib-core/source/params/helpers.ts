/*
 * Copyright 2025 Adobe. All rights reserved.
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
 * Checks if the given runtime action input value is non-empty.
 *
 * @param name - The name of the parameter. Required because of `aio app dev` compatibility: inputs mapped to undefined env vars come as $<input_name> in dev mode, but as '' in prod mode.
 * @param value - The value of the parameter.
 */
export function nonEmpty(name: string, value: unknown): boolean {
  const v = String(value)?.trim();
  return !!v && v !== `$${name}`;
}

/**
 * Checks if all required parameters are non-empty.
 *
 * @param params - The action input parameters.
 * @param required - The list of required parameter names.
 */
export function allNonEmpty(
  params: Record<string, unknown>,
  required: string[],
): boolean {
  return required.every((name) => nonEmpty(name, params[name]));
}

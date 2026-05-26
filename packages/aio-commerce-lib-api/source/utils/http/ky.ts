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

import * as kyModule from "ky";

import { toKyOptions } from "./fetch-options";

import type { KyInstance, Options } from "ky";

type KyInterop = KyInstance & { default?: KyInstance };
const ky = (kyModule.default as KyInterop).default ?? kyModule.default;

/**
 * Creates a Ky instance with the provided options.
 * @param options - The options for the Ky instance.
 */
export function createKy(options: Options): KyInstance {
  return ky.create(options);
}

/**
 * Extends the given Ky instance with the provided options if they are provided.
 * @param ky - The Ky instance to extend.
 * @param options - The options to extend the Ky instance with.
 */
export function optionallyExtendKy<TKy extends KyInstance>(
  kyInstance: TKy,
  options?: FetchOptions,
): TKy {
  return options
    ? (kyInstance.extend(toKyOptions(options)) as TKy)
    : kyInstance;
}

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

export type WorkerProcess = {
  type: "action";
  impl: string;
};

export type Operations = {
  workerProcess?: WorkerProcess[];
};

export type ActionDefinition = {
  function: string;
  web?: string;
  runtime?: string;
  inputs?: Record<string, string>;
  annotations?: Record<string, boolean | string>;
  include?: [string, string][];
};

export type Package = {
  license?: string;
  actions?: Record<string, ActionDefinition>;
};

export type RuntimeManifest = {
  packages?: Record<string, Package>;
};

export type ExtConfig = {
  hooks?: Record<string, string>;
  operations?: Operations;
  runtimeManifest?: RuntimeManifest;
};

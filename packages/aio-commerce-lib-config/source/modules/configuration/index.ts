/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// Configuration repository for data access
export { ConfigurationRepository } from "./configuration-repository";
// Main configuration functionality
export { getConfiguration } from "./get-config";
export { getConfigurationByKey } from "./get-config-by-key";
export { setConfiguration } from "./set-config";

// Types for configuration operations
export type {
  ConfigContext,
  ConfigOrigin,
  ConfigValue,
} from "./types";

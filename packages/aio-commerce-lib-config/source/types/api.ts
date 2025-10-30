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

import type { ConfigValue } from "../modules/configuration";
import type { ConfigSchemaField } from "../modules/schema";

// Public API Response Types
export interface GetConfigSchemaResponse {
  configSchema: ConfigSchemaField[];
}

export interface GetConfigurationResponse {
  scope: {
    id: string;
    code: string;
    level: string;
  };
  config: ConfigValue[];
}

export interface GetConfigurationByKeyResponse {
  scope: {
    id: string;
    code: string;
    level: string;
  };
  config: ConfigValue | null;
}

// Public API Request Types
export interface SetConfigurationRequest {
  config: Array<{
    name: string;
    value: string | number | boolean;
  }>;
}

export interface SetConfigurationResponse {
  message: string;
  timestamp: string;
  scope: {
    id: string;
    code: string;
    level: string;
  };
  config: Array<{
    name: string;
    value: string | number | boolean;
  }>;
}

// Set Custom Scope Tree Request/Response Types
export interface SetCustomScopeTreeRequest {
  scopes: CustomScopeInput[];
}

export interface CustomScopeInput {
  id?: string; // If not provided, it's a new scope
  code: string;
  label: string;
  level?: string; // Optional - defaults to base level if not provided
  is_editable: boolean;
  is_final: boolean;
  children?: CustomScopeInput[];
}

export interface SetCustomScopeTreeResponse {
  message: string;
  timestamp: string;
  scopes: CustomScopeOutput[];
}

export interface CustomScopeOutput {
  id: string;
  code: string;
  label: string;
  level: string;
  is_editable: boolean;
  is_final: boolean;
  children?: CustomScopeOutput[];
}

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

import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

import type { LanguageModel } from "ai";
import type { ReleaseNotesEnvironment } from "./types.ts";

export type SelectedModel = {
  model: LanguageModel;
  modelId: string;
};

/**
 * Selects the model from the `RELEASE_NOTES_MODEL` environment variable.
 */
export function selectModel(env: ReleaseNotesEnvironment): SelectedModel {
  const {
    RELEASE_NOTES_MODEL: modelId,
    RELEASE_NOTES_MODEL_ENDPOINT: baseURL,
  } = env;
  const model = createAmazonBedrock({ baseURL })(modelId);
  return { model, modelId };
}

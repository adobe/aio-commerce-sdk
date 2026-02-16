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

import type { InferOutput } from "valibot";
import type {
  CommerceAppConfigDomain,
  CommerceAppConfigSchemas,
} from "#config/index";

type DomainDefaults = Partial<{
  [Key in CommerceAppConfigDomain]: InferOutput<
    (typeof CommerceAppConfigSchemas)[Key]
  >;
}>;

/** The default values for the features of the commerce app config. */
export const DOMAIN_DEFAULTS = {
  businessConfig: {
    schema: [
      {
        type: "list",
        name: "sampleList",
        label: "Sample List",
        selectionMode: "multiple",

        default: ["a"],
        options: [
          { label: "Option A", value: "a" },
          { label: "Option B", value: "b" },
        ],
      },
      {
        type: "text",
        name: "sampleText",
        label: "Sample Text",
        default: "Hello, world!",
      },
    ],
  },

  "eventing.commerce": [
    {
      provider: {
        label: "Commerce Events Provider",
        description: "A description for your Commerce Events provider.",
      },

      events: [
        {
          name: "plugin.sample_event",
          fields: [],

          label: "Sample Event",
          description: "Use case description for the event.",
          runtimeActions: ["my-package/handle-sample-event"],
        },
      ],
    },
  ],

  "eventing.external": [
    {
      provider: {
        label: "External Events Provider",
        description: "A description for your External Events provider.",
      },

      events: [
        {
          name: "be-observer.sample_event",
          label: "Sample Event",
          description: "Use case description for the event.",
          runtimeActions: ["my-package/handle-sample-event"],
        },
      ],
    },
  ],

  "installation.customInstallationSteps": [
    {
      name: "sample-step",
      description: "Use case description for the step.",
      script: "./path/to/script.js",
    },
  ],
} satisfies DomainDefaults;

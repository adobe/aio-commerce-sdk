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
        default: ["a"],
        label: "Sample List",
        name: "sampleList",
        options: [
          { label: "Option A", value: "a" },
          { label: "Option B", value: "b" },
        ],
        selectionMode: "multiple",
        type: "list",
      },
      {
        default: "Hello, world!",
        label: "Sample Text",
        name: "sampleText",
        type: "text",
      },
    ],
  },

  "eventing.commerce": [
    {
      events: [
        {
          description: "Use case description for the event.",
          fields: [{ name: "*" }],

          label: "Sample Event",
          name: "plugin.sample_event",
          runtimeActions: ["my-package/handle-sample-event"],
        },
      ],
      provider: {
        description: "A description for your Commerce Events provider.",
        label: "Commerce Events Provider",
      },
    },
  ],

  "eventing.external": [
    {
      events: [
        {
          description: "Use case description for the event.",
          label: "Sample Event",
          name: "be-observer.sample_event",
          runtimeActions: ["my-package/handle-sample-event"],
        },
      ],
      provider: {
        description: "A description for your External Events provider.",
        label: "External Events Provider",
      },
    },
  ],

  "installation.customInstallationSteps": [
    {
      description: "Use case description for the step.",
      name: "sample-step",
      script: "./path/to/script.js",
    },
  ],

  webhooks: [
    {
      category: "modification",
      description: "A sample Commerce Webhook handler.",
      label: "Sample Webhook",
      runtimeAction: "my-package/handle-webhook",
      webhook: {
        batch_name: "my_app",
        hook_name: "sample_hook",
        method: "POST",
        webhook_method: "plugin.sample.event",
        webhook_type: "after",
      },
    },
    {
      category: "modification",
      description: "A sample Commerce Webhook handler using an explicit URL.",
      label: "Sample Webhook with URL",
      webhook: {
        batch_name: "my_app",
        hook_name: "sample_hook_url",
        method: "POST",
        url: "https://example.com/webhook",
        webhook_method: "plugin.sample.event",
        webhook_type: "after",
      },
    },
  ],
} satisfies DomainDefaults;

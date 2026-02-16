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

type FeatureDefaults = Partial<{
  [Key in CommerceAppConfigDomain]: InferOutput<
    (typeof CommerceAppConfigSchemas)[Key]
  >;
}>;

/** The default values for the features of the commerce app config. */
export const FEATURE_DEFAULTS = {
  businessConfig: {
    schema: [
      {
        type: "list",
        name: "paymentMethods",
        label: "Payment Methods",
        selectionMode: "multiple",

        default: ["credit_card"],
        options: [
          { label: "Credit Card", value: "credit_card" },
          { label: "PayPal", value: "paypal" },
          { label: "Apple Pay", value: "apple_pay" },
          { label: "Google Pay", value: "google_pay" },
        ],
      },
      {
        type: "list",
        name: "currency",
        label: "Currency",
        selectionMode: "single",
        default: "USD",
        options: [
          { label: "United States Dollar", value: "USD" },
          { label: "Euro", value: "EUR" },
        ],
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
          name: "observer.catalog_product_save_commit_after",
          fields: [{ name: "sku" }, { name: "price" }],

          label: "Catalog Product Save Commit After",
          description:
            "Triggered when a product is saved and committed to the database.",

          runtimeActions: ["my-package/handle-commerce-product-save"],
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
          name: "be-observer.catalog_product_create",
          label: "Catalog Product Create (Backoffice)",
          description:
            "Triggered when a product is created in the backoffice system.",

          runtimeActions: ["my-package/handle-external-product-create"],
        },
      ],
    },
  ],
} satisfies FeatureDefaults;

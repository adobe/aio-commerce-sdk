import { defineConfig } from "@adobe/aio-commerce-lib-app/config";

export default defineConfig({
  metadata: {
    id: "my-commerce-app", // alphanumeric + hyphens only, max 100 chars
    displayName: "My Commerce App", // shown in App Management UI, max 50 chars
    description: "A Commerce app built with aio-commerce-sdk.", // max 255 chars
    version: "1.0.0", // Major.Minor.Patch only, no pre-release identifiers
  },
  businessConfig: {
    schema: [
      // Single-select list — merchant picks one value from a fixed set
      {
        name: "shipping_provider", // required, non-empty; used as config key at runtime
        type: "list",
        selectionMode: "single", // "single" or "multiple"
        label: "Shipping Provider", // optional; shown as field label in Admin
        description: "Select the active shipping provider.", // optional; shown as help text
        options: [
          // required for list fields; each option needs both label and value
          { label: "FedEx", value: "fedex" },
          { label: "UPS", value: "ups" },
          { label: "DHL", value: "dhl" },
        ],
        default: "fedex", // required for single; must exactly match one of the option values
      },
      // Multi-select list — merchant picks one or more values
      {
        name: "enabled_payment_methods",
        type: "list",
        selectionMode: "multiple",
        label: "Enabled Payment Methods",
        options: [
          { label: "Credit Card", value: "cc" },
          { label: "PayPal", value: "paypal" },
          { label: "Apple Pay", value: "apple_pay" },
        ],
        default: ["cc", "paypal"], // optional array; defaults to []; each must match an option value
      },
      // Text — free-form string input
      {
        name: "store_code",
        type: "text",
        label: "Store Code",
        description: "Internal identifier for this store.",
        default: "", // optional string; defaults to ""
      },
      // Password — masked input for secrets; shown as *** in Admin
      {
        name: "api_key",
        type: "password",
        label: "API Key",
        description: "Secret key for the external service.",
        default: "", // must be "" — non-empty defaults are rejected to prevent secrets in config
      },
      // Email — validated email address input
      {
        name: "notification_email",
        type: "email",
        label: "Notification Email",
        default: "", // "" or a fully valid email address (e.g. "admin@example.com")
      },
      // URL — validated absolute URL input
      {
        name: "webhook_endpoint",
        type: "url",
        label: "Webhook Endpoint",
        default: "", // "" or a fully valid absolute URL (e.g. "https://service.example.com/hook")
      },
      // Tel — phone number input
      {
        name: "support_phone",
        type: "tel",
        label: "Support Phone",
        default: "", // "" or matches /^\+?[0-9\s\-()]+$/ (e.g. "+1 (800) 555-0100")
      },
      // Boolean — toggle switch
      {
        name: "debug_mode",
        type: "boolean",
        label: "Enable Debug Mode",
        default: false, // optional boolean; defaults to false
      },
      // Dynamic list — options resolved at runtime via a factory.
      // Use when option values depend on merchant-specific data (e.g. payment
      // methods enabled in the merchant's Commerce store). Any credentials the
      // factory uses must be declared as `inputs` for the action that resolves
      // the schema in that action's `ext.config.yaml`.
      {
        name: "default_payment_method",
        type: "dynamicList",
        selectionMode: "single",
        label: "Default Payment Method",
        // Receives the action's runtime params; may be sync or async.
        // Example: `await fetchPaymentMethods(params.PAYMENT_API_KEY)` then
        // map each entry to `{ label, value }`.
        options: () => [{ label: "Credit Card", value: "cc" }],
        // Required for single-select; optional for "multiple" (defaults to []).
        default: (resolvedOptions) => resolvedOptions[0].value,
      },
    ],
  },
});

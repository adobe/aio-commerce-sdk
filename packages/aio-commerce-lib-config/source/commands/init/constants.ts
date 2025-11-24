import type { ExtensibilityConfig } from "#modules/schema/types";

/** The default extensibility.config.js schema */
export const DEFAULT_EXTENSIBILITY_CONFIG_SCHEMA: ExtensibilityConfig = {
  businessConfig: {
    schema: [
      {
        name: "exampleList",
        type: "list",
        label: "Example List",
        options: [
          { label: "Option 1", value: "option1" },
          { label: "Option 2", value: "option2" },
        ],
        selectionMode: "single",
        default: "option1",
        description: "This is a description for the example list",
      },
      {
        name: "currency",
        type: "text",
        label: "Currency",
      },
    ],
  },
};

/** To match environment variables in the .env file */
export const ENV_VAR_REGEX = /^([A-Z_]+)=/;

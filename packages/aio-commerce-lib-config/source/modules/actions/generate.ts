import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import AioLogger from "@adobe/aio-lib-core-logging";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logger = AioLogger("@adobe/aio-commerce-lib-config:actions:generate", {
  level: process.env.LOG_LEVEL ?? "info",
});

const PACKAGE_NAME = "app-management";
const GENERATED_ACTIONS_PATH = ".generated/actions/app-management";
const GENERATED_SCHEMA_PATH = ".generated";

const COMMERCE_INPUTS = {
  AIO_COMMERCE_API_BASE_URL: "$AIO_COMMERCE_API_BASE_URL",
  AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY:
    "$AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY",
  AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET:
    "$AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET",
  AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN:
    "$AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN",
  AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
    "$AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET",
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "$AIO_COMMERCE_AUTH_IMS_CLIENT_ID",
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "$AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID:
    "$AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL:
    "$AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL",
  AIO_COMMERCE_AUTH_IMS_ORG_ID: "$AIO_COMMERCE_AUTH_IMS_ORG_ID",
} as const;

type ExtConfig = {
  hooks?: Record<string, string>;
  operations?: {
    workerProcess?: Array<{ type: string; impl: string }>;
  };
  runtimeManifest?: {
    packages?: {
      [packageName: string]: {
        license?: string;
        actions?: Record<string, ActionDefinition>;
      };
    };
  };
};

type ActionDefinition = {
  function: string;
  web: string;
  runtime: string;
  inputs: Record<string, string>;
  annotations: Record<string, boolean | string>;
  include?: [string, string][];
};

type ActionConfig = {
  name: string;
  templateFile: string;
  requiresCommerce?: boolean;
  requiresSchema?: boolean;
};

const RUNTIME_ACTIONS: ActionConfig[] = [
  {
    name: "get-scope-tree",
    templateFile: "get-scope-tree.js.template",
    requiresCommerce: true,
  },
  {
    name: "get-config-schema",
    templateFile: "get-config-schema.js.template",
    requiresSchema: true,
  },
  {
    name: "get-configuration",
    templateFile: "get-configuration.js.template",
    requiresSchema: true,
  },
  {
    name: "set-configuration",
    templateFile: "set-configuration.js.template",
  },
  {
    name: "set-custom-scope-tree",
    templateFile: "set-custom-scope-tree.js.template",
  },
  {
    name: "sync-commerce-scopes",
    templateFile: "sync-commerce-scopes.js.template",
    requiresCommerce: true,
  },
];

export async function generateRuntimeActions(): Promise<void> {
  await updateExtConfig();
  await generateActionFiles();
}

export async function generateSchema(validatedSchema?: unknown): Promise<void> {
  await generateSchemaFile(validatedSchema);
}

async function updateExtConfig(): Promise<void> {
  logger.info("📝 Updating ext.config.yaml...");

  const extConfigFolder = join(process.cwd(), "commerce-configuration-1");
  const extConfigPath = join(extConfigFolder, "ext.config.yaml");
  const extConfig = await readExtConfig(extConfigPath);

  buildOperations(extConfig);
  buildRuntimeManifest(extConfig);

  await writeExtConfig(extConfigPath, extConfig);
}

async function generateActionFiles(): Promise<void> {
  logger.info("🔧 Generating runtime actions...");

  const extConfigFolder = join(process.cwd(), "commerce-configuration-1");
  const outputDir = join(extConfigFolder, GENERATED_ACTIONS_PATH);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const templatesDir = join(__dirname, "templates");

  for (const action of RUNTIME_ACTIONS) {
    const templatePath = join(templatesDir, action.templateFile);
    const template = await readFile(templatePath, "utf-8");
    const actionPath = join(outputDir, `${action.name}.js`);
    await writeFile(actionPath, template, "utf-8");
  }

  logger.info(
    `✅ Generated ${RUNTIME_ACTIONS.length} action(s) in ${GENERATED_ACTIONS_PATH}\n`,
  );
}

async function generateSchemaFile(validatedSchema?: unknown): Promise<void> {
  const extConfigFolder = join(process.cwd(), "commerce-configuration-1");
  const outputDir = join(extConfigFolder, GENERATED_SCHEMA_PATH);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const schemaPath = join(outputDir, "configuration-schema.json");
  const schemaContent = validatedSchema ? validatedSchema : [];

  await writeFile(schemaPath, JSON.stringify(schemaContent, null, 2), "utf-8");
  logger.info("📄 Generated configuration-schema.json\n");
}

function buildActionDefinition(action: ActionConfig): ActionDefinition {
  const actionDef: ActionDefinition = {
    function: `${GENERATED_ACTIONS_PATH}/${action.name}.js`,
    web: "yes",
    runtime: "nodejs:22",
    inputs: {
      LOG_LEVEL: "info",
    },
    annotations: {
      "require-adobe-auth": true,
      final: true,
    },
  };

  if (action.requiresCommerce) {
    Object.assign(actionDef.inputs, COMMERCE_INPUTS);
  }

  if (action.requiresSchema) {
    actionDef.include = [
      [
        `${GENERATED_SCHEMA_PATH}/configuration-schema.json`,
        `${PACKAGE_NAME}/`,
      ],
    ];
  }

  return actionDef;
}

function buildOperations(extConfig: ExtConfig): void {
  if (!extConfig.operations) {
    extConfig.operations = {};
  }
  if (!extConfig.operations.workerProcess) {
    extConfig.operations.workerProcess = [];
  }

  const existingOps = extConfig.operations.workerProcess.filter(
    (op) => op.impl && !op.impl.startsWith(`${PACKAGE_NAME}/`),
  );
  const ourOps = RUNTIME_ACTIONS.map((action) => ({
    type: "action" as const,
    impl: `${PACKAGE_NAME}/${action.name}`,
  }));
  extConfig.operations.workerProcess = [...existingOps, ...ourOps];
}

function buildRuntimeManifest(extConfig: ExtConfig): void {
  extConfig.runtimeManifest ??= {};
  extConfig.runtimeManifest.packages ??= {};
  extConfig.runtimeManifest.packages[PACKAGE_NAME] ??= {
    license: "Apache-2.0",
    actions: {},
  };

  const actions: Record<string, ActionDefinition> = {};
  const existingActions =
    extConfig.runtimeManifest.packages[PACKAGE_NAME]?.actions ?? {};

  for (const action of RUNTIME_ACTIONS) {
    actions[action.name] = buildActionDefinition(action);
  }

  extConfig.runtimeManifest.packages[PACKAGE_NAME].actions = {
    ...existingActions,
    ...actions,
  };
}

async function readExtConfig(configPath: string): Promise<ExtConfig> {
  if (!existsSync(configPath)) {
    return {};
  }

  const content = await readFile(configPath, "utf-8");
  return (parseYaml(content) as ExtConfig) || {};
}

async function writeExtConfig(
  configPath: string,
  config: ExtConfig,
): Promise<void> {
  const yamlContent = stringifyYaml(config, {
    indent: 2,
    lineWidth: 0,
    defaultStringType: "PLAIN",
  });

  await writeFile(configPath, yamlContent, "utf-8");
}

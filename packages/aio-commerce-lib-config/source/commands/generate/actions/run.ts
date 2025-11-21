import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  EXTENSION_POINT_FOLDER_PATH,
  GENERATED_ACTIONS_PATH,
} from "#commands/constants";
import { makeOutputDirFor } from "#commands/utils";

import { RUNTIME_ACTIONS } from "./constants";
import { updateExtConfig } from "./lib";

// This will point to the directory where the script is running from.
// This is the dist/commands directory (as we use a facade to run the commands)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Run the generate actions command */
export async function run() {
  await updateExtConfig();
  await generateActionFiles();
}

/** Generate the action files */
async function generateActionFiles() {
  process.stdout.write("🔧 Generating runtime actions...\n");
  const outputDir = await makeOutputDirFor(
    join(EXTENSION_POINT_FOLDER_PATH, GENERATED_ACTIONS_PATH),
  );

  const templatesDir = join(__dirname, "generate/actions/templates");

  for (const action of RUNTIME_ACTIONS) {
    const templatePath = join(templatesDir, action.templateFile);
    const template = await readFile(templatePath, "utf-8");
    const actionPath = join(outputDir, `${action.name}.js`);

    await writeFile(actionPath, template, "utf-8");
  }

  process.stdout.write(
    `✅ Generated ${RUNTIME_ACTIONS.length} action(s) in ${GENERATED_ACTIONS_PATH}\n`,
  );
}

import { run as generateActions } from "../modules/actions/generate";
import { run as schemaValidationCommand } from "../modules/schema/validation/command";

export default async (_config: Record<string, unknown>) => {
  await schemaValidationCommand();
  await generateActions();
};

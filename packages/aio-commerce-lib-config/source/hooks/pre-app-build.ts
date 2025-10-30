import { run as generateActions } from "../modules/actions";
import { run as schemaValidationCommand } from "../modules/schema/validation";

export default async (_config: Record<string, unknown>) => {
  await schemaValidationCommand();
  await generateActions();
};

import {
  generateRuntimeActions,
  generateSchema,
} from "../modules/actions/generate";
import { run as schemaValidationCommand } from "../modules/schema/validation/command";

export default async () => {
  const validatedSchema = await schemaValidationCommand();
  await generateSchema(validatedSchema);

  await generateRuntimeActions();
};

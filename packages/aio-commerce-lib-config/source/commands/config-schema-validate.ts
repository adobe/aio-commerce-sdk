#!/usr/bin/env node

import { run as schemaValidationCommand } from "../modules/schema/validation/command";

(async () => {
  await schemaValidationCommand();
})();

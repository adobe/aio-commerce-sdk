#!/usr/bin/env node

import { run as schemaValidationCommand } from "../modules/schema/validation";

(async () => {
  await schemaValidationCommand();
})();

import type { PlopTypes } from "@turbo/gen";

import { getGeneratorConfig as createPackageGeneratorConfig } from "./create-package";

export default function generator(plop: PlopTypes.NodePlopAPI) {
  // List here the different monorepo-wide generators.
  plop.setGenerator("create-package", createPackageGeneratorConfig());
}

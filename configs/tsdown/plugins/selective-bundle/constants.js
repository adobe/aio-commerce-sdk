import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The dir where the private packages are located.
export const PRIVATE_PACKAGES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../packages-private",
);

// Get the list of private packages in the private packages directory.
export const PRIVATE_PACKAGES = (
  await readdir(PRIVATE_PACKAGES_DIR, {
    withFileTypes: true,
  })
)
  .filter((dir) => dir.isDirectory())
  .map((dir) => ({
    name: dir.name,
    path: join(PRIVATE_PACKAGES_DIR, dir.name),
  }));

// Info about the private packages, including their dependencies and peer dependencies.
export const PRIVATE_PACKAGES_INFO = await Promise.all(
  PRIVATE_PACKAGES.map(async (pkg) => {
    /** @type {import("type-fest").PackageJson} */
    const pkgJson = JSON.parse(
      await readFile(join(pkg.path, "package.json"), "utf-8"),
    );

    return {
      name: `${pkgJson.name}`,
      path: pkg.path,

      deps: {
        ...pkgJson.dependencies,
        ...pkgJson.peerDependencies,
      },
    };
  }),
);

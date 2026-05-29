/** Path (relative, as git reports it) of the hand-maintained OpenAPI spec. */
const LIB_APP_OPENAPI = "packages/aio-commerce-lib-app/docs/openapi.json";

const biomeWrite = (files) =>
  `biome check --write --no-errors-on-unmatched --files-ignore-unknown=true ${files
    .map((file) => `"${file}"`)
    .join(" ")}`;

export default {
  "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}": (files) => {
    const openapi = files.filter((file) => file.endsWith(LIB_APP_OPENAPI));
    const rest = files.filter((file) => !file.endsWith(LIB_APP_OPENAPI));

    const commands = [];
    if (rest.length > 0) {
      commands.push(biomeWrite(rest));
    }

    // Sort/filter the spec first, then let Biome normalize its whitespace.
    // Both run in this one task list (sequentially), so they never race the
    // generic Biome task on the same file.
    if (openapi.length > 0) {
      commands.push(
        "pnpm --filter @adobe/aio-commerce-lib-app run format:openapi",
        biomeWrite(openapi),
      );
    }

    return commands;
  },
  "*.md": `prettier --no-error-on-unmatched-pattern --write '**/*.md' "!**/{CODE_OF_CONDUCT.md,COPYRIGHT,LICENSE,SECURITY.md,CONTRIBUTING.md}"`,
  "*": "biome check --no-errors-on-unmatched --files-ignore-unknown=true",
};

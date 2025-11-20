/** The package manager used to install the package */
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/** Simple representation of a partial app.config.yaml file */
export type AppConfig = {
  extensions?: {
    [extensionKey: string]: {
      $include?: string;
      [configKey: string]: unknown;
    };
  };

  [configKey: string]: unknown;
};

/** Simple representation of a partial install.yaml file */
export type InstallYaml = {
  extensions: {
    extensionPointId: string;
  }[];

  [key: string]: unknown;
};

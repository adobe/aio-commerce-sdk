export type WorkerProcess = {
  type: "action";
  impl: string;
};

export type Operations = {
  workerProcess?: WorkerProcess[];
};

export type ActionDefinition = {
  function: string;
  web: string;
  runtime: string;
  inputs: Record<string, string>;
  annotations: Record<string, boolean | string>;
  include?: [string, string][];
};

export type Package = {
  license?: string;
  actions?: Record<string, ActionDefinition>;
};

export type RuntimeManifest = {
  packages?: Record<string, Package>;
};

export type ExtConfig = {
  hooks?: Record<string, string>;
  operations?: Operations;
  runtimeManifest?: RuntimeManifest;
};

export type ActionConfig = {
  name: string;
  templateFile: string;
  requiresCommerce?: boolean;
  requiresSchema?: boolean;
};

import { DEFAULT_CUSTOM_SCOPE_LEVEL } from "./utils";

import type {
  AcceptableConfigValue,
  ConfigValueWithOptionalOrigin,
} from "#modules/configuration/types";
import type { ConfigValue } from "./modules/configuration";
import type { ConfigSchemaField } from "./modules/schema";
import type { ScopeNode, ScopeTree } from "./modules/scope-tree";

// Re-export UUID utility
export { generateUUID } from "./utils";

/**
 * Checks if the given value is a non-empty string.
 * @param value The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates the provided arguments for scope retrieval.
 * @param args - The arguments to validate.
 * @returns True if the arguments are valid, false otherwise.
 */
export function areValidArgs(args: unknown[]): boolean {
  if (args.length === 2) {
    return isNonEmptyString(args[0]) && isNonEmptyString(args[1]);
  }
  if (args.length === 1) {
    return isNonEmptyString(args[0]);
  }
  return false;
}

/**
 * Finds a scope node by its ID.
 * @param tree - The scope tree to search.
 * @param id - The ID of the scope node to find.
 * @returns The found scope node or null if not found.
 */
function findScopeNodeById(tree: ScopeTree, id: string): ScopeNode | null {
  const traverse = (node: ScopeNode): ScopeNode | null => {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = traverse(child);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  for (const root of tree) {
    const found = traverse(root);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Derives the scope information from the provided arguments.
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find.
 * @param tree - The scope tree to search.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromCodeAndLevel(
  code: unknown,
  level: unknown,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!(isNonEmptyString(code) && isNonEmptyString(level))) {
    throw new Error("INVALID_ARGS: expected (code: string, level: string)");
  }
  const trimmedCode = code.trim();
  const trimmedLevel = level.trim();
  const path = findScopePath(tree, trimmedCode, trimmedLevel);
  const node = path.find(
    (scopeNode) =>
      scopeNode.code === trimmedCode && scopeNode.level === trimmedLevel,
  );

  if (path.length === 0 || !node) {
    throw new Error(
      `INVALID_SCOPE: Unknown scope code='${trimmedCode}' level='${trimmedLevel}'`,
    );
  }

  return {
    scopeCode: node.code,
    scopeLevel: node.level,
    scopeId: node.id,
    scopePath: path,
  };
}

/**
 * Derives the scope information from the provided id.
 * @param id - The id of the scope to find.
 * @param tree - The scope tree to search for the node.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromId(
  id: unknown,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!isNonEmptyString(id)) {
    throw new Error("INVALID_ARGS: expected (id: string)");
  }
  const trimmedId = id.trim();
  const node = findScopeNodeById(tree, trimmedId);
  if (!node) {
    throw new Error(`INVALID_SCOPE_ID: No scope found for id '${trimmedId}'`);
  }
  const path = findScopePath(tree, node.code, node.level);
  return {
    scopeCode: node.code,
    scopeLevel: node.level,
    scopeId: node.id,
    scopePath: path,
  };
}

/**
 * Derives scope from code with optional level (applies default if missing)
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find (optional, defaults to base level).
 * @param tree - The scope tree to search.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromCodeWithOptionalLevel(
  code: unknown,
  level: unknown | undefined,
  tree: ScopeTree,
): {
  scopeCode: string;
  scopeLevel: string;
  scopeId: string;
  scopePath: ScopeNode[];
} {
  if (!isNonEmptyString(code)) {
    throw new Error("INVALID_ARGS: expected (code: string)");
  }

  if (!isNonEmptyString(level)) {
    throw new Error("INVALID_ARGS: expected (level: string)");
  }

  const effectiveLevel = level?.trim() || DEFAULT_CUSTOM_SCOPE_LEVEL;
  return deriveScopeFromCodeAndLevel(code, effectiveLevel, tree);
}

/**
 * Derives the scope information from the provided arguments.
 * @param args - The arguments containing either (id), (code), or (code, level).
 * @param tree - The scope tree to search for the node.
 * @returns The derived scope information including code, level, id, and path.
 */
export function deriveScopeFromArgs(args: unknown[], tree: ScopeTree) {
  if (args.length === 2) {
    return deriveScopeFromCodeAndLevel(args[0], args[1], tree);
  }
  if (args.length === 1) {
    const arg = args[0];
    // Try as ID first, then as code with default level
    try {
      return deriveScopeFromId(arg, tree);
    } catch (_error) {
      // If ID lookup fails, treat as code with default level
      return deriveScopeFromCodeWithOptionalLevel(arg, undefined, tree);
    }
  }
  throw new Error("INVALID_ARGS: expected (id), (code), or (code, level)");
}

/**
 * Finds a scope path in the tree.
 * @param tree - The scope tree to search.
 * @param code - The code of the scope to find.
 * @param level - The level of the scope to find.
 * @returns The found scope path or an empty array if not found.
 */
export function findScopePath(tree: ScopeTree, code: string, level: string) {
  const path: ScopeNode[] = [];
  const traverse = (node: ScopeNode, parents: ScopeNode[]): boolean => {
    const extendedPath = parents.concat(node);
    if (node.code === code && node.level === level) {
      path.push(...extendedPath);
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (traverse(child, extendedPath)) {
          return true;
        }
      }
    }
    return false;
  };
  for (const root of tree) {
    if (traverse(root, [])) {
      return path.reverse();
    }
  }
  return [];
}

/**
 * Sanitize request config entries to contain only valid name/value pairs
 * @param entries - The entries to sanitize.
 * @returns The sanitized entries.
 */
export function sanitizeRequestEntries(
  entries: ConfigValueWithOptionalOrigin[],
): ConfigValueWithOptionalOrigin[] {
  const list = Array.isArray(entries) ? entries : [];
  return list
    .filter((entry) => {
      if (!entry || typeof entry.name !== "string") {
        return false;
      }
      const hasValidValue = ["string", "number", "boolean"].includes(
        typeof entry.value,
      );
      return entry.name.trim().length > 0 && hasValidValue;
    })
    .map((entry) => ({
      name: String(entry.name).trim(),
      value: entry.value as string | number | boolean,
      origin: entry.origin,
    }));
}

/**
 * Merge existing and requested entries, setting origin to the current scope for requested entries
 * @param existingScopeEntries - The existing scope entries.
 * @param requestedScopeEntries - The requested scope entries.
 * @param scopeCode - The code of the scope.
 * @param scopeLevel - The level of the scope.
 * @returns The merged scope entries.
 */
export function mergeScopes(
  existingScopeEntries: ConfigValueWithOptionalOrigin[],
  requestedScopeEntries: ConfigValueWithOptionalOrigin[],
  scopeCode: string,
  scopeLevel: string,
) {
  const mergedMap = new Map<string, ConfigValue>();
  for (const existingEntry of existingScopeEntries) {
    mergedMap.set(existingEntry.name, {
      name: existingEntry.name,
      value: existingEntry.value,
      origin: existingEntry.origin || { code: scopeCode, level: scopeLevel },
    });
  }

  for (const requestedEntry of requestedScopeEntries) {
    mergedMap.set(requestedEntry.name, {
      name: requestedEntry.name,
      value: requestedEntry.value,
      origin: { code: scopeCode, level: scopeLevel },
    });
  }

  return Array.from(mergedMap.values()).map((data) => ({
    name: data.name,
    value: data.value,
    origin: data.origin,
  }));
}

/**
 * Build default config entries from schema defaults
 * @param schema - The schema to build the defaults from.
 * @returns The default config entries.
 */
export function getSchemaDefaults(schema: ConfigSchemaField[]) {
  const defaults = schema
    .filter((field) => field.default !== undefined)
    .map((field) => ({
      name: field.name,
      value: field.default as string,
      origin: { code: "default", level: "system" },
    }));

  return { config: defaults };
}

/**
 * Merge inherited configs along the scope path and ensure schema defaults exist
 * @param loadScopeConfigFn - The function to load the scope config.
 * @param getSchemaFn - The function to get the schema.
 * @param configData - The config data to merge.
 * @param scopeCode - The code of the scope.
 * @param scopeLevel - The level of the scope.
 * @param scopePath - The path of the scope.
 * @returns The merged config data. Returns null if the config data is not valid.
 * @throws An error if the config data is not valid.
 */
export async function mergeWithSchemaDefaults(
  loadScopeConfigFn: (
    code: string,
  ) => Promise<{ scope: ScopeNode; config: ConfigValue[] } | null>,
  getSchemaFn: () => Promise<ConfigSchemaField[]>,
  configData: { scope: ScopeNode; config: ConfigValue[] },
  scopeCode: string,
  scopeLevel: string,
  scopePath: ScopeNode[],
) {
  const schema = await getSchemaFn();
  const defaultMap = new Map<string, AcceptableConfigValue>();

  for (const field of schema) {
    if (field.default !== undefined) {
      defaultMap.set(field.name, field.default);
    }
  }

  const merged: Map<string, ConfigValue> = new Map();

  // First, load from the inheritance path (most specific to least specific within the branch)
  for (const node of scopePath) {
    const persisted = await loadScopeConfigFn(node.code);
    if (persisted && Array.isArray(persisted.config)) {
      for (const entry of persisted.config) {
        if (!merged.has(entry.name)) {
          merged.set(entry.name, {
            name: entry.name,
            value: entry.value,
            origin: { code: node.code, level: node.level },
          });
        }
      }
    }
  }

  // Then, check global scope as fallback (if not already in the path)
  const hasGlobal = scopePath.some(
    (node) => node.code === "global" && node.level === "global",
  );

  if (!hasGlobal) {
    const globalConfig = await loadScopeConfigFn("global");
    if (globalConfig && Array.isArray(globalConfig.config)) {
      for (const entry of globalConfig.config) {
        if (!merged.has(entry.name)) {
          merged.set(entry.name, {
            name: entry.name,
            value: entry.value,
            origin: { code: "global", level: "global" },
          });
        }
      }
    }
  }

  if (configData && Array.isArray(configData.config)) {
    for (const entry of configData.config) {
      if (!merged.has(entry.name)) {
        merged.set(entry.name, {
          name: entry.name,
          value: entry.value,
          origin: entry.origin || {
            code: configData.scope?.code || scopeCode,
            level: configData.scope?.level || scopeLevel,
          },
        });
      }
    }
  }

  for (const [name, def] of defaultMap.entries()) {
    if (!merged.has(name)) {
      merged.set(name, {
        name,
        value: def,
        origin: { code: "default", level: "system" },
      });
    }
  }

  configData.config = Array.from(merged.entries()).map(([name, data]) => ({
    name,
    value: data.value,
    origin: data.origin,
  }));

  return configData;
}

# `mergePackageJsonDependencies()`

```ts
function mergePackageJsonDependencies(
  dependencies: PackageJsonDependencies,
  requiredDependencies: readonly PackageDependency[],
  dependencyMaps?: readonly Partial<Record<string, string>>[],
): WritablePackageJsonDependencies;
```

Defined in: [project.ts:225](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L225)

Merge required dependencies into a package.json dependency map when they are missing.

## Parameters

| Parameter              | Type                                                                   | Description                                 |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| `dependencies`         | `PackageJsonDependencies`                                              | Dependency map to update.                   |
| `requiredDependencies` | readonly [`PackageDependency`](../type-aliases/PackageDependency.md)[] | Dependencies that should exist.             |
| `dependencyMaps?`      | readonly `Partial`\<`Record`\<`string`, `string`\>\>[]                 | Package dependency maps to compare against. |

## Returns

`WritablePackageJsonDependencies`

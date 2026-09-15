# `mergePackageJsonDependencies()`

```ts
function mergePackageJsonDependencies(
  dependencies: PackageJsonDependencies,
  requiredDependencies: readonly PackageDependency[],
  dependencyMaps?: readonly Partial<Record<string, string>>[],
): WritablePackageJsonDependencies;
```

Defined in: [project.ts:225](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L225)

Merge required dependencies into a package.json dependency map when they are missing.

## Parameters

| Parameter              | Type                                                                   | Description                                 |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| `dependencies`         | `PackageJsonDependencies`                                              | Dependency map to update.                   |
| `requiredDependencies` | readonly [`PackageDependency`](../type-aliases/PackageDependency.md)[] | Dependencies that should exist.             |
| `dependencyMaps`       | readonly `Partial`\<`Record`\<`string`, `string`\>\>[]                 | Package dependency maps to compare against. |

## Returns

`WritablePackageJsonDependencies`

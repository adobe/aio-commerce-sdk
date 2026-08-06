# `getPackageDependencyInstallPlan()`

```ts
function getPackageDependencyInstallPlan(
  requiredDependencies: readonly PackageDependency[],
  cwd?: string,
): Promise<PackageDependencyInstallPlan>;
```

Defined in: [project.ts:177](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L177)

Resolve which dependencies are missing or installed with incompatible versions.

Installed package versions are compared with `semver.satisfies`. Declared
package.json ranges are not used as compatibility proof because they can
differ from what is actually installed.

## Parameters

| Parameter              | Type                                                                   | Description                                           |
| ---------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `requiredDependencies` | readonly [`PackageDependency`](../type-aliases/PackageDependency.md)[] | Dependencies that should exist.                       |
| `cwd`                  | `string`                                                               | Project directory to resolve installed packages from. |

## Returns

`Promise`\<`PackageDependencyInstallPlan`\>

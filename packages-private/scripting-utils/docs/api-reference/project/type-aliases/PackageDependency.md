# `PackageDependency`

```ts
type PackageDependency = {
  name: string;
  version: string;
};
```

Defined in: [project.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L33)

## Properties

### name

```ts
name: string;
```

Defined in: [project.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L35)

Package name as it appears in package.json.

---

### version

```ts
version: string;
```

Defined in: [project.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages-private/scripting-utils/source/project.ts#L38)

Version specifier to write or install, compared by exact string equality.

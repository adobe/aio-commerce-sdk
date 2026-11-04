# `PackageDependency`

```ts
type PackageDependency = {
  name: string;
  version: string;
};
```

Defined in: [project.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L33)

## Properties

### name

```ts
name: string;
```

Defined in: [project.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L35)

Package name as it appears in package.json.

---

### version

```ts
version: string;
```

Defined in: [project.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages-private/scripting-utils/source/project.ts#L38)

Version specifier to write or install, compared by exact string equality.

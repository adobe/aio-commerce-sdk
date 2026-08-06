# `PackageDependency`

```ts
type PackageDependency = {
  name: string;
  version: string;
};
```

Defined in: [project.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L33)

## Properties

### name

```ts
name: string;
```

Defined in: [project.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L35)

Package name as it appears in package.json.

---

### version

```ts
version: string;
```

Defined in: [project.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages-private/scripting-utils/source/project.ts#L38)

Version specifier to write or install, compared by exact string equality.

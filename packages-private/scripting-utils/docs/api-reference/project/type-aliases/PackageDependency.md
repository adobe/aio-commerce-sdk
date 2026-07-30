# `PackageDependency`

```ts
type PackageDependency = {
  name: string;
  version: string;
};
```

Defined in: [project.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages-private/scripting-utils/source/project.ts#L33)

## Properties

### name

```ts
name: string;
```

Defined in: [project.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages-private/scripting-utils/source/project.ts#L35)

Package name as it appears in package.json.

---

### version

```ts
version: string;
```

Defined in: [project.ts:38](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages-private/scripting-utils/source/project.ts#L38)

Version specifier to write or install, compared by exact string equality.

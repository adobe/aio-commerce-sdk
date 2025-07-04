# `@aio-commerce-sdk/generators`

Turborepo code generators for scaffolding code and maintaining consistency in the Adobe Commerce SDK monorepo.

This internal package provides custom generators that help automate repetitive tasks and ensure code follows the project's standards and conventions.

## Overview

The generators package leverages [Turborepo's code generation](https://turbo.build/repo/docs/guides/generating-code) capabilities to provide interactive scaffolding tools for various development tasks.

### Available Generators

- **[`create-package`](./create-package/README.md)**: Scaffolds a new package with all necessary configuration files

More generators can be added as needed to automate other common tasks like creating components, actions, or other standardized code structures.

## Usage

To run a generator, use the `turbo gen` command followed by the generator name:

```shell
pnpm turbo gen <generator-name>
```

For example:

```shell
pnpm turbo gen create-package
```

## Creating New Generators

To add a new generator:

1. Create a new directory under `turbo/generators/` with your generator name
2. Add an `index.ts` file with the generator logic
3. Create a `template/` directory for any file templates
4. Update the `config.ts` to register your generator
5. Create a `README.md` documenting the generator

### Generator Structure

```
turbo/generators/
├── your-generator/
│   ├── index.ts          # Generator logic
│   ├── template/         # File templates
│   │   └── example.ts.hbs
│   └── README.md         # Generator documentation
└── config.ts             # Generator configuration
```

### Template System

Generators use [Handlebars](https://handlebarsjs.com/) for templating. Common patterns:

- Use `.hbs` extension for files needing variable interpolation
- Access variables with `{{variableName}}` syntax
- Use conditionals: `{{#if condition}}...{{/if}}`
- Iterate with: `{{#each items}}...{{/each}}`

### Testing Your Generator

1. Run the generator with test inputs
2. Verify generated files match expectations
3. Ensure generated code builds and runs correctly
4. Clean up test artifacts

## Best Practices

1. **Document each generator** with its own README in the generator directory
2. **Validate user input** before generating files
3. **Provide helpful prompts** with clear descriptions and examples
4. **Use consistent naming** for variables and templates
5. **Test edge cases** like existing files and invalid inputs
6. **Keep generators focused** on a single, well-defined task

## Related

- [Turborepo Generators](https://turbo.build/repo/docs/guides/generating-code) - Official documentation
- [Contributing Guide](../../.github/CONTRIBUTING.md#creating-a-new-package) - Package creation guidelines
- [Handlebars Documentation](https://handlebarsjs.com/) - Template syntax reference

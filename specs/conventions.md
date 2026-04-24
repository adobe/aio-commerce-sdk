# Spec Conventions

## Structure

Specs live in `specs/features/`. Each spec is a single Markdown file named after
the feature it describes (e.g. `capability-discovery.md`).

`specs/features/_template.md` is the canonical template for new specs.

## File naming

- Lowercase, hyphen-separated (e.g. `capability-discovery.md`)
- Name the file after the feature, not the ticket

## Spec format

Specs follow an RFC-inspired format. Every spec must include, in order:

1. **Title** — `# RFC: Feature Name`
2. **Metadata** — ticket and creation date (see below)
3. **Summary** — one paragraph explanation of the feature
4. **Motivation** — the problem being solved; be concrete about the pain point
5. **Developer experience** — how the feature looks from an app developer's perspective; use examples
6. **Design** — technical detail; interactions with existing SDK features, implementation approach, edge cases
7. **Drawbacks** — honest reasons not to do this
8. **Rationale and alternatives** — why this design, what was rejected and why
9. **Unresolved questions** — open decisions; remove the section once all are resolved
10. **Future possibilities** — natural extensions; out-of-scope ideas worth capturing

## Metadata

Every spec includes a metadata block below the title:

```md
- **Ticket:** [CEXT-XXXX](https://jira.corp.adobe.com/browse/CEXT-XXXX)
- **Created:** YYYY-MM-DD
```

## Keeping specs current

A spec is a living document. When implementation reveals that the approach needs
to change, update the spec before (or alongside) the code change. The associated
Jira ticket is the changelog — link it in the commit message.

# Spec Conventions

## Structure

Specs live in `specs/features/`. Each spec is a single Markdown file named after the feature it describes (e.g. `capability-discovery.md`).

`specs/features/_template.md` is the canonical template for new specs.

## File naming

- Lowercase, hyphen-separated (e.g. `capability-discovery.md`)
- Name the file after the feature, not the ticket

## Spec structure

Every spec must include, in order:

1. **Metadata** — table of CEXT tickets that introduced or changed this spec
2. **Background** — the problem being solved and why it matters
3. **Goals** — what the feature must achieve, stated as outcomes
4. **Approach** — how the feature works; use numbered subsections for multi-step flows
5. **Security** — any security considerations; omit the section if there are none
6. **Open questions** — unresolved decisions; remove the section once all are resolved

Additional sections (e.g. **SDK upgrades**, **Migration**) may be added as needed.

## Metadata table

Every spec must have a Metadata section at the top listing the CEXT tickets that created or significantly changed it. Add a row each time a ticket results in a spec update.

```md
## Metadata

| Ticket                                                    | Description     |
| --------------------------------------------------------- | --------------- |
| [CEXT-XXXX](https://jira.corp.adobe.com/browse/CEXT-XXXX) | Initial spec    |
| [CEXT-YYYY](https://jira.corp.adobe.com/browse/CEXT-YYYY) | Added X section |
```

## Keeping specs current

A spec is a living document. When implementation reveals that the approach needs to change, update the spec before (or alongside) the code change. The metadata table entry for the corresponding ticket serves as the changelog.

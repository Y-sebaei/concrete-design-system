# Changesets

Every change that reaches the published package needs a changeset. Run:

```
npm run changeset
```

pick the bump, and write the entry as a note to whoever upgrades: what changed
and what they have to do about it, not what the commit did.

The console is in the ignore list. It is a private workspace and is never
published, so it has no version to bump.

## Which bump

**patch** for a fix that does not change the API or the rendered output in a way
a consumer would notice.

**minor** for a new component, a new prop, or a new token.

**major** for anything that changes what existing markup renders. That includes
token value changes, because a design system's output is its API: shifting a
ramp step moves every surface that references it, and a consumer who pinned a
minor range would get it without asking.

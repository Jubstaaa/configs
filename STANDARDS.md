# Repository standards

How every repository here is set up, so the same decision is not made twice.

Configuration that can be shared lives in this package. What cannot be shared —
release strategy, environments, the shape of a README — is written down here
instead, and every repository is assigned to one of four tiers.

## The four tiers

| Tier | What it is | Versioning | Deploys |
| --- | --- | --- | --- |
| 1. Site | A site with one audience and no installers | None | `main` to production, automatically |
| 2. Package | Something other people install | Semantic versioning | Tag publishes to the registry |
| 3. Distributed app | Something other people download | Semantic versioning | Tag builds the artifacts |
| 4. Product | A system with real users and real data | Semantic versioning | `main` to staging, promoted to production |

### Tier assignments

- **Tier 1** — acw-istanbul, bishy_web, brief, haccoo, kral-sakir-web, playpark-web, portfolio, statbox, waqt, webgooh, yasin-rofcanin-site
- **Tier 2** — auto-watch, font-mapper, hono-telescope, standup-mr, tailwind-hitslop, upbeat, x-dm-export
- **Tier 3** — iconstate, lol-config-editor, pixel-guess
- **Tier 4** — prosbase-v2

A repository moves up a tier when its audience changes, never because its code
grew. A personal site with a thousand users is still Tier 1; a library with two
users is Tier 2 from its first publish, because the version number is a promise
to whoever installed it.

## Releases

Tiers 2, 3 and 4 run `release-please` on `main`. It reads Conventional Commits,
keeps one release pull request open, and on merge writes the version, updates
`CHANGELOG.md` and pushes the tag. The existing `release.yml` fires on that tag.

This exists because tagging by hand does not survive contact with automation. A
dependency update merges to `main`, the site goes out, and the tag that should
record it is never pushed, because pushing it is a step somebody has to
remember in each of nine repositories.

Tier 1 cuts no tags. Nobody depends on the version of a site, and a changelog
with one reader is a chore, not a record.

## Environments

Tier 4 deploys `main` to `staging` without asking. Promotion to `production` is
a GitHub Environment with a required reviewer, and the promoted commit is the
one that gets the tag. Tiers 1 to 3 deploy straight to `production`; a staging
copy of a personal project is a second thing to keep running for no reader.

## Quality gate

Every repository calls the same reusable workflow, so a check added once is
added everywhere:

```yaml
jobs:
    check:
        uses: Jubstaaa/deploy-actions/.github/workflows/quality-gate.yml@main
```

It runs the repository's own scripts, so tool versions and configuration stay
in the project. Scripts are named `lint`, `format:check`, `typecheck`, `test`,
`audit`, `knip`, `jscpd`, `depcruise` and `build`. `typecheck` has no hyphen:
the workflow calls the script by name, so the name is part of the contract.

## READMEs

Every README opens with what the project is, in one sentence, for someone who
arrived from a search result and does not yet know. Then: what it needs, how to
run it, how to test it, how it is deployed. Anything a contributor needs that is
not in that list goes in `docs/`, not in the README and not in `CONTRIBUTING.md`,
which is shared and lives in `Jubstaaa/.github`.

Project-specific content belongs in the repository. Everything else — the
contribution guide, the security policy, the code of conduct, issue and pull
request templates, funding links — is inherited from `Jubstaaa/.github` and must
not be copied into a repository.

## Dependencies

Renovate, configured by extending `github>Jubstaaa/configs`. Dependabot is not
used: it has no shared configuration, so every repository would carry its own
copy of the same file.

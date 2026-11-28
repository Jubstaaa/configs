# configs

Shared ESLint, TypeScript, Prettier and Renovate configuration for the
repositories in this account.

Before this existed, ten repositories carried ten copies of the same settings
and had drifted apart: four Next.js apps agreed on only a fifth to a third of
their ESLint rules, Prettier was spelled three different ways across three
different file names, and one project had ended up on the opposite formatting
style — semicolons on, two-space indent — from every other. The settings here
are the ones most of those repositories already agreed on, raised to the
strictest version any of them had reached.

## Install

```bash
bun add -D @jubstaa/config
```

## Use

### ESLint

Pick the preset that matches the project and pass it the directory holding
`tsconfig.json`, which the type-aware rules need:

```ts
// eslint.config.ts
import { next } from '@jubstaa/config/eslint/next'

export default next({ tsconfigRootDir: import.meta.dirname })
```

The presets ship their own types, so a TypeScript config is checked like any
other source file: a misspelled option or a wrong `refresh` target is a type
error rather than a silent no-op. ESLint loads it through `jiti`, which comes
with this package — nothing else to install. `eslint.config.mjs` still works.

`next` for a Next.js app, `node` for a server or CLI, `library` for a published
package, `base` for anything else. Each returns a flat config array, so project
rules go after it:

```js
export default [
    ...next({ tsconfigRootDir: import.meta.dirname }),
    { rules: { 'no-console': 'off' } },
]
```

Pass `internalPattern` when the project's path alias is not `@/`:

```js
next({
    internalPattern: ['^@/', '^#site/'],
    tsconfigRootDir: import.meta.dirname,
})
```

### TypeScript

```json
{
    "extends": "@jubstaa/config/tsconfig/next",
    "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

`paths`, `include` and `exclude` stay in the project: they describe its layout,
not its standards.

### Prettier

```json
{ "prettier": "@jubstaa/config/prettier" }
```

### Renovate

```json
{ "extends": ["github>Jubstaaa/configs"] }
```

One line per repository, and the dependency policy lives in one place. Dependabot
has no equivalent — its configuration cannot be shared — which is the reason to
move.

Patch and minor updates merge on their own through Renovate's platform
automerge, which waits for the branch ruleset's required checks, so no
repository needs a workflow holding a token to merge its own pull requests.
Majors wait for a human, and so do four framework groups wherever they appear:
**payload** (a bump can need a schema migration), **next** and **react** (they
change prerendering and the RSC runtime) and **tailwind** (the generated CSS).
GitHub Actions and container majors wait too, since those run inside a deploy
next to its secrets. A rule only matches a package the project actually has, so
a repository without Payload is unaffected by the Payload rule.

**eslint** (with typescript-eslint and the plugins) and **vite** move as one
group each. TypeScript majors are held back for every repository: typescript-eslint
does not support TypeScript 7 yet, so taking it breaks lint. Remove that rule from
`default.json` once typescript-eslint's peer range includes 7.

New npm, Cargo and GitHub Actions releases wait a week before a pull request
is opened: compromised versions are usually caught and pulled within days.
Security updates do not wait. A repository that wants a longer cooldown sets
`minimumReleaseAge` itself.

React Native projects on Expo need no extra line. The Expo packages move as one group
everywhere, and the versions each Expo SDK pins (`react`, `react-native`, reanimated and
so on) are held back only in `apps/mobile`, where the Expo app lives: holding `react`
back anywhere else would freeze it in every web project.

### Repository checks

```sh
npx --yes --package=@jubstaa/config jubstaa-doctor
```

`jubstaa-doctor` checks what every repository is supposed to have, from the
repository root. `--only=<check>[,<check>]` runs a subset; the checks are
`yaml-comments`, `files`, `package` and `scripts`.

| Check           | What it fails on                                                                                                                                                                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yaml-comments` | a prose comment in any tracked `.yml`/`.yaml`. Machine-readable ones stay: the version after a pinned action SHA (`# v7.0.1`), which is what Renovate reads to know which tag that SHA is, plus `yaml-language-server:`, `renovate:`, `yamllint`, `checkov:skip=`, `trivy:ignore:`, `noqa`, `shellcheck disable=`, `prettier-ignore` and `zizmor:` |
| `files`         | a missing `LICENSE` or `README.md`                                                                                                                                                                                                                                                                                                                 |
| `package`       | a missing `license`, `name`, `repository`, `type` or `packageManager`; a public package with no `version`                                                                                                                                                                                                                                          |
| `scripts`       | a script under an old name — `type-check`, `tsc`, `types`, `deps:check`, `deps:graph`, `dupes`, `duplication` — when the canonical name (`typecheck`, `depcruise`, `jscpd`) is not also defined                                                                                                                                                    |

The reason to keep comments out of YAML is the same as in code: a comment
cannot be run, so it goes stale without anything failing. Rationale belongs in
the README, where it is read; the workflow should say what it does by itself.

The release pull request is opened with a personal access token rather than
`GITHUB_TOKEN`: a pull request opened with the built-in token starts no
workflows, so its required checks would never report and the release would sit
blocked behind the branch ruleset.

Two things the release workflow no longer says in a comment, because they are
easy to break and belong here: it runs on **Node 24**, since trusted publishing
needs npm 11.5.1 or newer, and it deliberately sets **no `NODE_AUTH_TOKEN`** —
npm reverts to token authentication when one is present, and the OIDC identity
(`id-token: write`) is the credential that also produces provenance.

### Branch protection

Not here. [`Jubstaaa/protect-main`](https://github.com/Jubstaaa/protect-main)
keeps a ruleset on every repository's default branch in step with the checks
its pull requests actually report, on a schedule, so a repository created
tomorrow is covered without being named.

ESLint 10 is required: the presets read `.gitignore` through the
`includeIgnoreFile` that `eslint/config` exports, which ESLint 9 does not have.

### How this package is built

The presets are TypeScript, compiled to JavaScript and `.d.ts` by `tsc` into
`dist/`, which is what the `exports` map points at. Authoring them in
TypeScript is not cosmetic: when they were `.js` the type-aware rules never
looked at them, so a deprecated API and a plugin config that can be `undefined`
sat in them unnoticed. Both are fixed here.

`outDir` is not in the TypeScript bases any more. A relative `outDir` resolves
against the file that declares it, so a project extending
`@jubstaa/config/tsconfig/library` and emitting would have written its build
into `node_modules`. Paths describe a project's layout, so they belong in the
project.

## What the presets decide

**Type-aware linting everywhere.** `strictTypeChecked` and
`stylisticTypeChecked` from typescript-eslint, not the plain `recommended`
preset. These catch floating promises, unsafe `any` flow and misused
`await` — the bugs that type checking alone does not.

**Imports are sorted and type-only imports are marked.** Perfectionist sorts
them naturally; `consistent-type-imports` writes them inline. That combination
is what `verbatimModuleSyntax` needs to erase types correctly.

**Unused code is an error, with `_` as the escape hatch.** A leading underscore
on a variable, argument or caught error silences it, so a deliberate placeholder
reads differently from an oversight.

**No comments.** `eslint-plugin-no-comments` rejects comment blocks. Directives
still pass — `@ts-expect-error`, `eslint-disable`, `prettier-ignore`, `v8
ignore` — because those are instructions to tooling, not prose. The reasoning
that would have gone in a comment goes in the commit message, the pull request,
or a file like this one.

**`console` is limited to `error` and `warn`,** which are the levels that go to
server logs. Scripts and config files are exempt, since reporting to a terminal
is their job.

**Tests relax two rules.** Asymmetric matchers (`expect.any`,
`expect.stringContaining`) are typed `any` by every test runner, so
`no-unsafe-argument` and `no-unsafe-assignment` would fire on correct code.

**Prettier goes last** and turns off every rule it owns, so formatting is
settled in one place.

## What the TypeScript bases decide

Beyond `strict`, all four turn on the checks that catch real bugs rather than
style: `noUncheckedIndexedAccess` (an array lookup can miss),
`exactOptionalPropertyTypes` (absent is not the same as `undefined`),
`noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch`.

`noUnusedLocals` and `noUnusedParameters` are deliberately left off: ESLint's
`no-unused-vars` already covers them, reports them as you type, and understands
the `_` prefix.

`verbatimModuleSyntax` is on, so a type import that is not marked as one is an
error rather than a runtime import of nothing.

## Formatting

Four spaces, no semicolons, single quotes, `es5` trailing commas, arrow
parentheses omitted where possible, and the closing bracket on the same line.
Prettier's default print width is kept, which is why no `printWidth` appears.

`.editorconfig` is not installable from a package; copy the one at the root of
this repository into a project that needs it.

## License

MIT

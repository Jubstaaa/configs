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
bun add -D github:Jubstaaa/configs
```

## Use

### ESLint

Pick the preset that matches the project and pass it the directory holding
`tsconfig.json`, which the type-aware rules need:

```js
// eslint.config.mjs
import next from '@jubstaaa/config/eslint/next'

export default next({ tsconfigRootDir: import.meta.dirname })
```

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
next({ internalPattern: ['^@/', '^#site/'], tsconfigRootDir: import.meta.dirname })
```

### TypeScript

```json
{
    "extends": "@jubstaaa/config/tsconfig/next",
    "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

`paths`, `include` and `exclude` stay in the project: they describe its layout,
not its standards.

### Prettier

```json
{ "prettier": "@jubstaaa/config/prettier" }
```

### Renovate

```json
{ "extends": ["github>Jubstaaa/configs"] }
```

One line per repository, and the dependency policy lives in one place. Dependabot
has no equivalent — its configuration cannot be shared — which is the reason to
move.

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

import type { Linter } from 'eslint'

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

import type { PresetOptions } from './base.js'

import { base } from './base.js'

export function next({
    internalPattern = ['^@/'],
    tsconfigRootDir,
}: PresetOptions = {}): Linter.Config[] {
    return defineConfig([
        globalIgnores([
            '.next/**',
            '.velite/**',
            'out/**',
            'build/**',
            'next-env.d.ts',
        ]),
        ...nextVitals,
        ...nextTs,
        ...a11yBlock(),
        ...base({ internalPattern, tsconfigRootDir }),
        {
            files: ['next.config.{ts,mts,js,mjs}'],
            rules: { '@typescript-eslint/require-await': 'off' },
        },
    ])
}

function a11yBlock(): Linter.Config[] {
    const configs = [...nextVitals, ...nextTs] as Linter.Config[]
    const registered = configs.find(entry => entry.plugins?.['jsx-a11y'])
        ?.plugins?.['jsx-a11y']
    const rules = registered?.configs?.recommended as Linter.Config | undefined

    if (!rules?.rules) return []

    return [{ files: ['**/*.{jsx,tsx}'], rules: rules.rules }]
}

export default next

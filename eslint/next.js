import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

import { base } from './base.js'

export function next({ internalPattern = ['^@/'], tsconfigRootDir } = {}) {
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

function a11yBlock() {
    const registered = [...nextVitals, ...nextTs].find(
        entry => entry.plugins?.['jsx-a11y']
    )?.plugins['jsx-a11y']

    if (!registered?.configs?.recommended?.rules) return []

    return [
        {
            files: ['**/*.{jsx,tsx}'],
            rules: registered.configs.recommended.rules,
        },
    ]
}

export default next

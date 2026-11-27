import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsxA11y from 'eslint-plugin-jsx-a11y'

import { base } from './base.js'

export function next({ tsconfigRootDir, internalPattern = ['^@/'] } = {}) {
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
        { rules: jsxA11y.flatConfigs.recommended.rules },
        ...base({ internalPattern, tsconfigRootDir }),
        {
            files: ['next.config.{ts,mts,js,mjs}'],
            rules: { '@typescript-eslint/require-await': 'off' },
        },
    ])
}

export default next

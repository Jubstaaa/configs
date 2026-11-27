import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

import { base } from './base.js'

function a11yBlock() {
    const registered = [...nextVitals, ...nextTs].find(
        entry => entry.plugins?.['jsx-a11y']
    )
    const rules = jsxA11y.flatConfigs.recommended.rules
    return registered
        ? { files: ['**/*.{jsx,tsx}'], rules }
        : {
              files: ['**/*.{jsx,tsx}'],
              plugins: { 'jsx-a11y': jsxA11y },
              rules,
          }
}

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
        a11yBlock(),
        ...base({ internalPattern, tsconfigRootDir }),
        {
            files: ['next.config.{ts,mts,js,mjs}'],
            rules: { '@typescript-eslint/require-await': 'off' },
        },
    ])
}

export default next

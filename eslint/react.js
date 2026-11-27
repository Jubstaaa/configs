import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

import { base } from './base.js'

export function react({
    internalPattern = ['^@/'],
    refresh = 'vite',
    tsconfigRootDir,
} = {}) {
    return defineConfig([
        globalIgnores(['dist/**', 'build/**', 'coverage/**']),
        reactHooks.configs.flat.recommended,
        reactRefresh.configs[refresh],
        jsxA11y.flatConfigs.recommended,
        ...base({ internalPattern, tsconfigRootDir }),
    ])
}

export default react

import { defineConfig, globalIgnores } from 'eslint/config'

import { base } from './base.js'

export function library({ tsconfigRootDir, internalPattern = ['^@/'] } = {}) {
    return defineConfig([
        globalIgnores(['dist/**', 'lib/**', 'coverage/**', '*.d.ts']),
        ...base({ internalPattern, tsconfigRootDir }),
        {
            files: ['src/**/*.{ts,tsx}'],
            rules: {
                '@typescript-eslint/explicit-module-boundary-types': 'error',
            },
        },
    ])
}

export default library

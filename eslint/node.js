import { defineConfig, globalIgnores } from 'eslint/config'

import { base } from './base.js'

export function node({ internalPattern = ['^@/'], tsconfigRootDir } = {}) {
    return defineConfig([
        globalIgnores(['dist/**', 'build/**', 'coverage/**']),
        ...base({ internalPattern, tsconfigRootDir }),
    ])
}

export default node

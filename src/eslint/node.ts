import type { Linter } from 'eslint'

import { defineConfig, globalIgnores } from 'eslint/config'

import type { PresetOptions } from './base.js'

import { base } from './base.js'

export function node({
    internalPattern = ['^@/'],
    tsconfigRootDir,
}: PresetOptions = {}): Linter.Config[] {
    return defineConfig([
        globalIgnores(['dist/**', 'build/**', 'coverage/**']),
        ...base({ internalPattern, tsconfigRootDir }),
    ])
}

export default node

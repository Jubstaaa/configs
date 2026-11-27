import type { Linter } from 'eslint'

import { defineConfig, globalIgnores } from 'eslint/config'

import type { PresetOptions } from './base.js'

import { base } from './base.js'

export function library({
    internalPattern = ['^@/'],
    tsconfigRootDir,
}: PresetOptions = {}): Linter.Config[] {
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

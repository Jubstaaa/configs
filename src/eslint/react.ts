import type { Linter } from 'eslint'

import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

import type { PresetOptions } from './base.js'

import { base } from './base.js'

export interface ReactPresetOptions extends PresetOptions {
    refresh?: RefreshTarget | undefined
}

export type RefreshTarget = 'next' | 'recommended' | 'vite'

export function react({
    internalPattern = ['^@/'],
    refresh = 'vite',
    tsconfigRootDir,
}: ReactPresetOptions = {}): Linter.Config[] {
    return defineConfig([
        globalIgnores(['dist/**', 'build/**', 'coverage/**']),
        ...present<Linter.Config>(
            reactHooks.configs.flat.recommended,
            reactRefresh.configs[refresh]
        ),
        jsxA11y.flatConfigs.recommended,
        ...base({ internalPattern, tsconfigRootDir }),
    ])
}

function present<T>(...configs: (T | undefined)[]): T[] {
    return configs.filter(config => config !== undefined)
}

export default react

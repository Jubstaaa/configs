import { includeIgnoreFile } from '@eslint/compat'
import prettier from 'eslint-config-prettier/flat'
import noComments from 'eslint-plugin-no-comments'
import perfectionist from 'eslint-plugin-perfectionist'
import { defineConfig } from 'eslint/config'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import tseslint from 'typescript-eslint'

export function base({ internalPattern = ['^@/'], tsconfigRootDir } = {}) {
    return defineConfig([
        ...gitignore(tsconfigRootDir),
        {
            extends: [
                tseslint.configs.strictTypeChecked,
                tseslint.configs.stylisticTypeChecked,
            ],
            files: ['**/*.{ts,tsx,mts,cts}'],
            languageOptions: {
                parserOptions: { projectService: true, tsconfigRootDir },
            },
            rules: {
                '@typescript-eslint/consistent-type-imports': [
                    'error',
                    { fixStyle: 'inline-type-imports' },
                ],
                '@typescript-eslint/no-empty-function': [
                    'error',
                    { allow: ['arrowFunctions'] },
                ],
                '@typescript-eslint/no-import-type-side-effects': 'error',
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                        argsIgnorePattern: '^_',
                        caughtErrorsIgnorePattern: '^_',
                        varsIgnorePattern: '^_',
                    },
                ],
                '@typescript-eslint/prefer-nullish-coalescing': [
                    'error',
                    { ignorePrimitives: { string: true } },
                ],
                '@typescript-eslint/restrict-template-expressions': [
                    'error',
                    { allowNumber: true },
                ],
            },
        },

        perfectionist.configs['recommended-natural'],
        {
            rules: {
                'perfectionist/sort-imports': [
                    'error',
                    { internalPattern, type: 'natural' },
                ],
            },
        },

        {
            plugins: { 'no-comments': noComments },
            rules: {
                'no-comments/disallowComments': [
                    'error',
                    {
                        allow: [
                            '/(usr|bin)/',
                            '#__PURE__',
                            '/ <reference',
                            '@jsx',
                            '@license',
                            '@preserve',
                            '@ts-',
                            '@vitest-environment',
                            'biome-ignore',
                            'c8 ignore',
                            'eslint',
                            'global',
                            'istanbul ',
                            'prettier-ignore',
                            'v8 ignore',
                        ],
                    },
                ],
                'no-console': ['error', { allow: ['error', 'warn'] }],
            },
        },

        {
            files: [
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'e2e/**',
                'test/**',
                'tests/**',
            ],
            rules: {
                '@typescript-eslint/await-thenable': 'off',
                '@typescript-eslint/no-confusing-void-expression': 'off',
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-class-instance-assignment': 'off',
                '@typescript-eslint/no-unsafe-enum-assignment': 'off',
                '@typescript-eslint/require-await': 'off',
                '@typescript-eslint/unbound-method': 'off',
                'no-console': 'off',
            },
        },
        {
            files: ['scripts/**', '**/*.config.{ts,mts,js,mjs}'],
            rules: { 'no-console': 'off' },
        },

        prettier,
    ])
}

function gitignore(root) {
    if (!root) return []
    const file = join(root, '.gitignore')
    return existsSync(file) ? [includeIgnoreFile(file)] : []
}

export default base

import { defineConfig, globalIgnores } from 'eslint/config'

import { node } from './dist/eslint/node.js'

export default defineConfig([
    globalIgnores(['dist']),
    ...node({ tsconfigRootDir: import.meta.dirname }),
])

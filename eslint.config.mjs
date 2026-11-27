import { defineConfig, globalIgnores } from 'eslint/config'

import { node } from './eslint/node.js'

export default defineConfig([
    globalIgnores(['node_modules/**']),
    ...node({ tsconfigRootDir: import.meta.dirname }),
])

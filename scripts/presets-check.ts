import type { Linter } from 'eslint'

import type { PresetOptions } from '../src/eslint/base.js'

type Preset = (options?: PresetOptions) => Linter.Config[]

const presets = ['base', 'next', 'node', 'library', 'react']

for (const preset of presets) {
    const loaded = (await import(`../dist/eslint/${preset}.js`)) as {
        default: Preset
    }
    const blocks = loaded.default({ tsconfigRootDir: process.cwd() })
    if (blocks.length === 0) {
        throw new Error(`${preset} produced no config`)
    }
    console.log(`${preset}: ${String(blocks.length)} blocks`)
}

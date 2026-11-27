const presets = ['base', 'next', 'node', 'library', 'react']

for (const preset of presets) {
    const { default: build } = await import(`../dist/eslint/${preset}.js`)
    const blocks = build({ tsconfigRootDir: process.cwd() })
    if (!Array.isArray(blocks) || blocks.length === 0) {
        throw new Error(`${preset} produced no config`)
    }
    console.log(`${preset}: ${blocks.length} blocks`)
}

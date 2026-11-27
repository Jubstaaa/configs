declare module 'eslint-plugin-no-comments' {
    import type { ESLint } from 'eslint'

    const plugin: ESLint.Plugin
    export default plugin
}

declare module 'eslint-plugin-jsx-a11y' {
    import type { Linter } from 'eslint'

    const plugin: {
        flatConfigs: { recommended: Linter.Config; strict: Linter.Config }
    }
    export default plugin
}

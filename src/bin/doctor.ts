#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

interface PackageJson {
    license?: unknown
    name?: unknown
    packageManager?: unknown
    private?: unknown
    repository?: unknown
    scripts?: Record<string, string>
    type?: unknown
    version?: unknown
}

type Report = (message: string) => void

const ALLOWED_COMMENT = [
    /^\s?v?\d+(\.\d+)*(-[\w.]+)?\s*$/,
    /^\s?yaml-language-server:/,
    /^\s?renovate:/,
    /^\s?yamllint\b/,
    /^\s?checkov:skip=/,
    /^\s?trivy:ignore:/,
    /^\s?noqa\b/,
    /^\s?shellcheck\s+(disable|shell)=/,
    /^\s?prettier-ignore\b/,
    /^\s?zizmor:\s/,
]

const CHECKS = [
    'yaml-comments',
    'files',
    'package',
    'readme',
    'scripts',
] as const

const REQUIRED_FIELDS = ['license', 'name', 'repository'] as const

const REQUIRED_FILES = ['LICENSE', 'README.md']

const SCRIPT_ALIASES: Record<string, string> = {
    'check-types': 'typecheck',
    'deps:check': 'depcruise',
    'deps:graph': 'depcruise',
    'dupes': 'jscpd',
    'duplication': 'jscpd',
    'ts-check': 'typecheck',
    'tsc': 'typecheck',
    'type': 'typecheck',
    'type-check': 'typecheck',
    'types': 'typecheck',
}

type Check = (typeof CHECKS)[number]

function files(list: string[], report: Report): void {
    for (const required of REQUIRED_FILES) {
        if (!list.includes(required)) report(`missing ${required}`)
    }
}

function packageFields(pkg: null | PackageJson, report: Report): void {
    if (!pkg) return
    for (const field of REQUIRED_FIELDS) {
        if (pkg[field] === undefined) report(`package.json: no "${field}"`)
    }
    if (pkg.packageManager === undefined) {
        report(
            'package.json: no "packageManager" (pin the version CI installs)'
        )
    }
    if (pkg.private !== true && pkg.version === undefined) {
        report('package.json: a published package needs "version"')
    }
}

function readme(list: string[], report: Report): void {
    if (!list.includes('README.md')) return
    const text = readFileSync('README.md', 'utf8').replace(
        /^(```|~~~)[\s\S]*?^\1/gm,
        ''
    )
    if (!/^# \S/m.test(text)) report('README.md: no "# " title')
    if (!/^## licen[cs]e\s*$/im.test(text)) {
        report('README.md: no "## License" section')
    }
}

function readPackage(): null | PackageJson {
    try {
        return JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson
    } catch {
        return null
    }
}

function scripts(pkg: null | PackageJson, report: Report): void {
    if (!pkg) return
    const names = Object.keys(pkg.scripts ?? {})
    for (const name of names) {
        const canonical = SCRIPT_ALIASES[name]
        if (canonical !== undefined && !names.includes(canonical)) {
            report(`package.json: script "${name}" should be "${canonical}"`)
        }
    }
}

function stripComment(line: string): null | string {
    let quote: null | string = null
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (quote !== null) {
            if (character === quote) quote = null
            continue
        }
        if (character === '"' || character === "'") {
            quote = character
            continue
        }
        if (
            character === '#' &&
            (index === 0 || /\s/.test(line[index - 1] ?? ''))
        ) {
            return line.slice(index + 1)
        }
    }

    return null
}

function tracked(): string[] {
    return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
}

function yamlComments(list: string[], report: Report): void {
    for (const file of list.filter(entry => /\.ya?ml$/.test(entry))) {
        readFileSync(file, 'utf8')
            .split('\n')
            .forEach((line, index) => {
                const comment = stripComment(line)
                if (!comment?.trim()) return
                if (ALLOWED_COMMENT.some(allowed => allowed.test(comment))) {
                    return
                }
                report(
                    `${file}:${String(index + 1)}  prose comment in YAML: #${comment.trimEnd()}`
                )
            })
    }
}

const only = process.argv
    .filter(argument => argument.startsWith('--only='))
    .flatMap(argument => argument.slice('--only='.length).split(','))
    .filter(Boolean)

for (const name of only) {
    if (!CHECKS.includes(name as Check)) {
        console.error(`unknown check "${name}"; known: ${CHECKS.join(', ')}`)
        process.exit(2)
    }
}

const wanted = (name: Check): boolean =>
    only.length === 0 || only.includes(name)

const problems: string[] = []
const report: Report = message => problems.push(message)
const list = tracked()
const pkg = readPackage()

if (wanted('yaml-comments')) yamlComments(list, report)
if (wanted('files')) files(list, report)
if (wanted('package')) packageFields(pkg, report)
if (wanted('readme')) readme(list, report)
if (wanted('scripts')) scripts(pkg, report)

if (problems.length > 0) {
    for (const problem of problems) console.error(problem)
    console.error(
        `\n${basename(process.cwd())}: ${String(problems.length)} problem${problems.length === 1 ? '' : 's'}`
    )
    process.exit(1)
}

console.log('repo checks passed')

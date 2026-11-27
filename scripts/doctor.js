#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

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

const REQUIRED_FILES = ['LICENSE', 'README.md']

const REQUIRED_FIELDS = ['license', 'name', 'repository', 'type']

const SCRIPT_ALIASES = {
    'check-types': 'typecheck',
    'deps:check': 'depcruise',
    'deps:graph': 'depcruise',
    'dupes': 'jscpd',
    'duplication': 'jscpd',
    'format': 'format',
    'ts-check': 'typecheck',
    'tsc': 'typecheck',
    'type': 'typecheck',
    'type-check': 'typecheck',
    'types': 'typecheck',
}

const CHECKS = ['yaml-comments', 'files', 'package', 'scripts']

function files(list, report) {
    for (const required of REQUIRED_FILES) {
        if (!list.includes(required)) report(`missing ${required}`)
    }
}

function packageFields(pkg, report) {
    if (!pkg) return
    for (const field of REQUIRED_FIELDS) {
        if (pkg[field] === undefined) report(`package.json: no "${field}"`)
    }
    if (!pkg.packageManager) {
        report(
            'package.json: no "packageManager" (pin the version CI installs)'
        )
    }
    if (pkg.private !== true && !pkg.version) {
        report('package.json: a published package needs "version"')
    }
}

function readPackage() {
    try {
        return JSON.parse(readFileSync('package.json', 'utf8'))
    } catch {
        return null
    }
}

function scripts(pkg, report) {
    if (!pkg) return
    const names = Object.keys(pkg.scripts ?? {})
    for (const name of names) {
        const canonical = SCRIPT_ALIASES[name]
        if (canonical && canonical !== name && !names.includes(canonical)) {
            report(`package.json: script "${name}" should be "${canonical}"`)
        }
    }
}

function stripComment(line) {
    let quote = null
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i]
        if (quote) {
            if (ch === quote) quote = null
            continue
        }
        if (ch === '"' || ch === "'") {
            quote = ch
            continue
        }
        if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
            return line.slice(i + 1)
        }
    }
    return null
}

function tracked() {
    return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
        .split('\0')
        .filter(Boolean)
}

function yamlComments(files, report) {
    for (const file of files.filter(f => /\.ya?ml$/.test(f))) {
        const lines = readFileSync(file, 'utf8').split('\n')
        lines.forEach((line, index) => {
            const comment = stripComment(line)
            if (comment === null) return
            if (!comment.trim()) return
            if (ALLOWED_COMMENT.some(allowed => allowed.test(comment))) return
            report(
                `${file}:${index + 1}  prose comment in YAML: #${comment.trimEnd()}`
            )
        })
    }
}

const only = process.argv
    .filter(a => a.startsWith('--only='))
    .flatMap(a => a.slice('--only='.length).split(','))
    .filter(Boolean)

for (const name of only) {
    if (!CHECKS.includes(name)) {
        console.error(`unknown check "${name}"; known: ${CHECKS.join(', ')}`)
        process.exit(2)
    }
}

const wanted = name => only.length === 0 || only.includes(name)

const problems = []
const report = message => problems.push(message)
const list = tracked()
const pkg = readPackage()

if (wanted('yaml-comments')) yamlComments(list, report)
if (wanted('files')) files(list, report)
if (wanted('package')) packageFields(pkg, report)
if (wanted('scripts')) scripts(pkg, report)

if (problems.length) {
    for (const problem of problems) console.error(problem)
    console.error(
        `\n${basename(process.cwd())}: ${problems.length} problem${problems.length === 1 ? '' : 's'}`
    )
    process.exit(1)
}

console.log('repo checks passed')

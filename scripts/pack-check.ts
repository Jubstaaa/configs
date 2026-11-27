import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

interface Manifest {
    bin: Record<string, string>
    exports: Record<string, Record<string, string> | string>
}

interface Packed {
    files: { path: string }[]
}

const report = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], { encoding: 'utf8' })
) as Packed[]

const packed = new Set(report[0]?.files.map(file => file.path) ?? [])

const { bin, exports: map } = JSON.parse(
    readFileSync('package.json', 'utf8')
) as Manifest

const declared = [
    ...Object.values(map).flatMap(entry =>
        typeof entry === 'string' ? [entry] : Object.values(entry)
    ),
    ...Object.values(bin),
]

const missing = declared
    .map(path => path.replace('./', ''))
    .filter(path => !packed.has(path))

if (missing.length > 0) {
    throw new Error(`declared but not packed: ${missing.join(', ')}`)
}

console.log(`every export and bin is packed: ${String(declared.length)} paths`)

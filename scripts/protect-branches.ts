import { parseArgs } from 'node:util'

const RULESET = 'protect-main'

interface Ruleset {
    id: number
    name: string
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
            'accept': 'application/vnd.github+json',
            'authorization': `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
            'content-type': 'application/json',
            'x-github-api-version': '2022-11-28',
        },
    })
    if (!response.ok) {
        throw new Error(
            `${init?.method ?? 'GET'} ${path} -> ${String(response.status)} ${await response.text()}`
        )
    }

    return response.json() as Promise<T>
}

function jobNames(workflow: string): string[] {
    const jobs = workflow.split('\njobs:\n')[1]
    if (!jobs) return []

    const lines = jobs.split('\n')
    const first = lines.find(line => /^\s+[a-z][\w-]*:\s*$/.test(line))
    if (!first) return []

    const indent = first.length - first.trimStart().length
    const atIndent = new RegExp(`^ {${String(indent)}}([a-z][\\w-]*):\\s*$`)
    const names: string[] = []
    let current: null | string = null
    let body = ''

    const flush = (): void => {
        if (
            current !== null &&
            !/if:.*event_name\s*!==?\s*'pull_request'/.test(body)
        ) {
            names.push(current)
        }
        body = ''
    }

    for (const line of lines) {
        const match = atIndent.exec(line)
        if (match?.[1] !== undefined) {
            flush()
            current = match[1]
        } else {
            body += `${line}\n`
        }
    }
    flush()

    return names
}

async function protect(
    owner: string,
    repo: string,
    apply: boolean
): Promise<void> {
    const checks = await requiredChecks(owner, repo)
    if (checks.length === 0) {
        console.log(`${repo}: no pull_request workflow, skipped`)

        return
    }

    const body = {
        conditions: { ref_name: { exclude: [], include: ['~DEFAULT_BRANCH'] } },
        enforcement: 'active',
        name: RULESET,
        rules: [
            { type: 'deletion' },
            { type: 'non_fast_forward' },
            {
                parameters: {
                    required_status_checks: checks.map(context => ({
                        context,
                    })),
                    strict_required_status_checks_policy: true,
                },
                type: 'required_status_checks',
            },
        ],
        target: 'branch',
    }

    const existing = (
        await gh<Ruleset[]>(`/repos/${owner}/${repo}/rulesets`)
    ).find(rule => rule.name === RULESET)

    if (!apply) {
        console.log(
            `${repo}: would ${existing ? 'update' : 'create'} with [${checks.join(', ')}]`
        )

        return
    }

    await gh(
        existing
            ? `/repos/${owner}/${repo}/rulesets/${String(existing.id)}`
            : `/repos/${owner}/${repo}/rulesets`,
        {
            body: JSON.stringify(body),
            method: existing ? 'PUT' : 'POST',
        }
    )
    console.log(
        `${repo}: ${existing ? 'updated' : 'created'} [${checks.join(', ')}]`
    )
}

async function requiredChecks(owner: string, repo: string): Promise<string[]> {
    const files = await gh<{ name: string; path: string }[]>(
        `/repos/${owner}/${repo}/contents/.github/workflows`
    ).catch(() => [])
    const names = new Set<string>()
    for (const file of files) {
        if (!/^(ci|check|test)\.ya?ml$/.test(file.name)) continue
        const { content } = await gh<{ content: string }>(
            `/repos/${owner}/${repo}/contents/${file.path}`
        )
        const text = Buffer.from(content, 'base64').toString('utf8')
        if (!text.includes('pull_request')) continue
        for (const job of jobNames(text)) names.add(job)
    }

    return [...names].sort()
}

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { apply: { type: 'boolean' }, owner: { type: 'string' } },
})
const owner = values.owner ?? 'Jubstaaa'

if (positionals.length === 0) {
    console.error('usage: bun scripts/protect-branches.ts [--apply] <repo...>')
    process.exit(1)
}

for (const repo of positionals) {
    await protect(owner, repo, values.apply === true).catch(
        (error: unknown) => {
            console.error(`${repo}: ${String(error)}`)
            process.exitCode = 1
        }
    )
}

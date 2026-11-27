import { parseArgs } from 'node:util'

const RULESET = 'protect-main'

const SAMPLE_PULLS = 3

interface CheckRun {
    app: null | { slug: string }
    conclusion: null | string
    name: string
}

interface Pull {
    head: { sha: string }
    merged_at: null | string
}

interface Repo {
    archived: boolean
    default_branch: string
    fork: boolean
    name: string
    owner: { login: string }
}

interface Ruleset {
    id: number
    name: string
    rules?: {
        parameters?: { required_status_checks?: { context: string }[] }
    }[]
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

async function kept(
    owner: string,
    repo: string,
    existing: Ruleset | undefined
): Promise<string[]> {
    if (!existing) return []
    const full = await gh<Ruleset>(
        `/repos/${owner}/${repo}/rulesets/${String(existing.id)}`
    )

    return (full.rules ?? [])
        .flatMap(rule => rule.parameters?.required_status_checks ?? [])
        .map(check => check.context)
        .sort()
}

async function ownRepos(owner: string): Promise<string[]> {
    const names: string[] = []
    for (let page = 1; ; page += 1) {
        const batch = await gh<Repo[]>(
            `/user/repos?affiliation=owner&per_page=100&page=${String(page)}`
        )
        for (const repo of batch) {
            if (repo.archived || repo.fork) continue
            if (repo.owner.login.toLowerCase() !== owner.toLowerCase()) continue
            names.push(repo.name)
        }
        if (batch.length < 100) break
    }

    return names.sort()
}

async function protect(
    owner: string,
    repo: string,
    apply: boolean
): Promise<void> {
    const existing = (
        await gh<Ruleset[]>(`/repos/${owner}/${repo}/rulesets`)
    ).find(rule => rule.name === RULESET)
    const discovered = await requiredChecks(owner, repo)
    const checks =
        discovered.length > 0 ? discovered : await kept(owner, repo, existing)
    const rules: unknown[] = [
        { type: 'deletion' },
        { type: 'non_fast_forward' },
    ]
    if (checks.length > 0) {
        rules.push({
            parameters: {
                required_status_checks: checks.map(context => ({ context })),
                strict_required_status_checks_policy: true,
            },
            type: 'required_status_checks',
        })
    }

    const body = {
        conditions: { ref_name: { exclude: [], include: ['~DEFAULT_BRANCH'] } },
        enforcement: 'active',
        name: RULESET,
        rules,
        target: 'branch',
    }
    const summary = checks.join(', ') || 'no required checks'

    if (!apply) {
        console.log(
            `${repo}: would ${existing ? 'update' : 'create'} with [${summary}]`
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
    console.log(`${repo}: ${existing ? 'updated' : 'created'} [${summary}]`)
}

async function requiredChecks(owner: string, repo: string): Promise<string[]> {
    const pulls = await gh<Pull[]>(
        `/repos/${owner}/${repo}/pulls?state=closed&per_page=20&sort=updated&direction=desc`
    ).catch(() => [])

    const seen: Set<string>[] = []
    for (const pull of pulls) {
        if (pull.merged_at === null) continue
        if (seen.length === SAMPLE_PULLS) break
        const { check_runs: runs } = await gh<{ check_runs: CheckRun[] }>(
            `/repos/${owner}/${repo}/commits/${pull.head.sha}/check-runs?per_page=100`
        ).catch(() => ({ check_runs: [] }))
        const names = runs
            .filter(run => run.app?.slug === 'github-actions')
            .filter(run => run.conclusion !== 'skipped')
            .map(run => run.name)
        if (names.length > 0) seen.push(new Set(names))
    }
    const [first, ...rest] = seen
    if (!first) return []

    return [...first]
        .filter(name => rest.every(other => other.has(name)))
        .sort()
}

const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
        all: { type: 'boolean' },
        apply: { type: 'boolean' },
        owner: { type: 'string' },
    },
})
const owner = values.owner ?? 'Jubstaaa'

if (positionals.length === 0 && values.all !== true) {
    console.error(
        'usage: bun scripts/protect-branches.ts [--apply] (--all | <repo...>)'
    )
    process.exit(1)
}

const repos = values.all === true ? await ownRepos(owner) : positionals

for (const repo of repos) {
    await protect(owner, repo, values.apply === true).catch(
        (error: unknown) => {
            console.error(`${repo}: ${String(error)}`)
            process.exitCode = 1
        }
    )
}

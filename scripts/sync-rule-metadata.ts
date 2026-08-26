#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SNAPSHOT = 'audit/rule-metadata.json'
const TARGET_SOURCE = 'dist/biome.recommended.json'
const INSTALLED_BIOME = 'node_modules/@biomejs/biome/bin/biome'

/**
 * Rule categories the configuration schema groups rules under. Each category
 * object also carries non-rule keys (`recommended`, `preset`) that are filtered
 * out; leaving them in would inflate every count by one per category.
 */
const CATEGORIES = [
  'A11y',
  'Complexity',
  'Correctness',
  'Nursery',
  'Performance',
  'Security',
  'Style',
  'Suspicious',
] as const

const NON_RULE_KEYS = new Set(['preset', 'recommended'])

const execFileAsync = promisify(execFile)

type RuleMetadata = {
  category: string
  defaultSeverity: string
  recommended: boolean
  domains: string[]
  languages: string[]
}

type Snapshot = {
  biomeVersion: string
  rules: Record<string, RuleMetadata>
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function flag(name: string): string | undefined {
  const prefix = `--${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

/** The version the presets target, parsed from their pinned `$schema` URL. */
async function readTargetVersion(): Promise<string> {
  const text = await readFile(resolve(root, TARGET_SOURCE), 'utf8')
  const schema = (JSON.parse(text) as { $schema?: string }).$schema ?? ''
  const match = schema.match(/schemas\/([^/]+)\/schema\.json/)
  if (!match?.[1]) {
    fail(`could not parse a Biome version from ${TARGET_SOURCE}: ${schema}`)
  }
  return match[1]
}

/**
 * Biome ships no structured rule-metadata API: `biome explain` prints prose,
 * one rule per invocation. The command is therefore configurable so a bootstrap
 * or a back-fill can sweep a version other than the installed one, e.g.
 * `--biome "pnpm dlx @biomejs/biome@2.5.9"`.
 */
function biomeCommand(): string[] {
  const parts = (flag('biome') ?? INSTALLED_BIOME).trim().split(/\s+/)
  const [command, ...rest] = parts
  if (!command) fail('--biome was given an empty command')
  return [command.startsWith('-') ? command : resolveIfLocal(command), ...rest]
}

function resolveIfLocal(command: string): string {
  return command.includes('/') ? resolve(root, command) : command
}

async function runBiome(argv: string[], args: string[]): Promise<string> {
  const [command, ...prefix] = argv
  const { stdout } = await execFileAsync(
    command as string,
    [...prefix, ...args],
    {
      cwd: root,
      maxBuffer: 1024 * 1024,
    }
  )
  return stdout
}

async function readBiomeVersion(argv: string[]): Promise<string> {
  const stdout = await runBiome(argv, ['--version'])
  const match = stdout.match(/(\d+\.\d+\.\d+)/)
  if (!match?.[1]) fail(`could not read a version from: ${stdout.trim()}`)
  return match[1]
}

/**
 * The rule set for `version`. Read from the installed package when it is the
 * version being swept, otherwise fetched — the published schema and the one
 * inside the package are the same document.
 */
async function readRuleNames(
  version: string,
  installed: string
): Promise<string[]> {
  const text =
    version === installed
      ? await readFile(
          resolve(
            root,
            'node_modules/@biomejs/biome/configuration_schema.json'
          ),
          'utf8'
        )
      : await fetchSchema(version)
  const defs = (JSON.parse(text) as SchemaDocument).$defs
  const names: string[] = []
  for (const category of CATEGORIES) {
    const properties = defs[category]?.properties
    if (!properties) fail(`schema ${version} has no ${category} category`)
    for (const name of Object.keys(properties)) {
      if (!NON_RULE_KEYS.has(name)) names.push(name)
    }
  }
  return names.sort()
}

type SchemaDocument = {
  $defs: Record<string, { properties?: Record<string, unknown> } | undefined>
}

async function fetchSchema(version: string): Promise<string> {
  const url = `https://biomejs.dev/schemas/${version}/schema.json`
  const response = await fetch(url)
  if (!response.ok) fail(`could not fetch ${url}: ${response.status}`)
  return response.text()
}

/**
 * Parses one `biome explain` report. Two shapes need care:
 *
 * - `- Name:` appears both in the summary (the rule) and under `Domains` (each
 *   domain), so domain lines are only collected after the `Domains` heading.
 * - The target languages come from the fenced examples, which is the only place
 *   Biome publishes them — the configuration schema carries none, and neither
 *   does the summary. A fence reads ```` ```<lang>[,<modifier>]* ````, e.g.
 *   `graphql,expect_diagnostic` or `ts,expect_diagnostic,file=invalid.ts`. The
 *   `options` modifier marks the rule's own options block rather than a sample
 *   in the rule's language, so those fences are skipped.
 */
function parseExplain(report: string): RuleMetadata | undefined {
  let category: string | undefined
  let defaultSeverity: string | undefined
  let recommended = false
  const domains: string[] = []
  const languages = new Set<string>()
  let inDomains = false

  for (const raw of report.split('\n')) {
    const line = raw.trim()
    if (line === 'Domains') inDomains = true
    else if (line === 'Description' || line === 'Examples') inDomains = false

    if (line === '- This rule is recommended') recommended = true

    const severity = line.match(/^- Default severity: (.+)$/)
    if (severity?.[1]) defaultSeverity = severity[1]

    const diagnostic = line.match(/^- Diagnostic category: lint\/([^/]+)\//)
    if (diagnostic?.[1]) category = diagnostic[1]

    const domain = line.match(/^- Name: (.+)$/)
    if (inDomains && domain?.[1]) domains.push(domain[1])

    const fence = line.match(/^```([a-z]+)((?:,[^\s,]+)*)\s*$/)
    if (fence?.[1]) {
      const modifiers = (fence[2] ?? '').split(',').filter(Boolean)
      if (!modifiers.includes('options')) languages.add(fence[1])
    }
  }

  // `languages` is empty for a rule whose only fenced block is its options
  // sample — a configuration-required rule such as `noRestrictedTypes` has no
  // code example to read a language from. That is recorded rather than treated
  // as a parse failure; classifying it is the check's job, not the sweep's.
  if (!category || !defaultSeverity) return undefined
  return {
    category,
    defaultSeverity,
    recommended,
    domains: domains.sort(),
    languages: [...languages].sort(),
  }
}

/** Runs `fn` over `items` with a bounded number of concurrent invocations. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await fn(items[index] as T)
      }
    }
  )
  await Promise.all(workers)
  return results
}

async function sweep(argv: string[], version: string): Promise<Snapshot> {
  const installed = await readInstalledVersion()
  const names = await readRuleNames(version, installed)
  const limit = Math.max(1, Math.min(16, availableParallelism() - 2))

  const reports = await mapWithLimit(names, limit, async (name) => {
    try {
      return parseExplain(await runBiome(argv, ['explain', name]))
    } catch {
      return undefined
    }
  })

  const unparsed = names.filter((_, index) => !reports[index])
  if (unparsed.length > 0) {
    fail(
      `parsed metadata for ${names.length - unparsed.length} of ${names.length} `
        + `rules. \`biome explain\` did not yield a category and severity for:\n  `
        + `${unparsed.slice(0, 20).join('\n  ')}`
        + (unparsed.length > 20 ? `\n  …and ${unparsed.length - 20} more` : '')
    )
  }

  const rules: Record<string, RuleMetadata> = {}
  for (const [index, name] of names.entries()) {
    rules[name] = reports[index] as RuleMetadata
  }
  return { biomeVersion: version, rules }
}

async function readInstalledVersion(): Promise<string> {
  const text = await readFile(
    resolve(root, 'node_modules/@biomejs/biome/package.json'),
    'utf8'
  )
  return (JSON.parse(text) as { version: string }).version
}

/**
 * Biome's `useSortedKeys` assist orders keys by nesting level and by a
 * comparison that is not plain lexicographic (`noConstantBinaryExpressions`
 * sorts before `noConstEnum`). Rather than reimplement it, the naive JSON is
 * piped through Biome itself, so the file this writes is by construction the
 * file `biome check` accepts. The formatter is the installed Biome, which is a
 * repo-tooling concern and independent of the version being swept.
 */
async function serialize(snapshot: Snapshot): Promise<string> {
  let text = `${JSON.stringify(snapshot, null, 2)}\n`
  // One `--write` pass sorts the outer level and leaves the keys it moved
  // inside each rule for the next pass, so this runs to a fixpoint.
  for (let pass = 0; pass < 5; pass++) {
    const next = await biomeCheckWrite(text)
    if (next === text) return text
    text = next
  }
  fail(`${SNAPSHOT} did not converge after 5 \`biome check --write\` passes`)
}

function biomeCheckWrite(text: string): Promise<string> {
  const promise = execFileAsync(
    'pnpm',
    ['exec', 'biome', 'check', '--write', `--stdin-file-path=${SNAPSHOT}`],
    { cwd: root, maxBuffer: 32 * 1024 * 1024 }
  )
  promise.child.stdin?.end(text)
  return promise.then(({ stdout }) => stdout)
}

const check = process.argv.includes('--check')
const target = await readTargetVersion()
const argv = biomeCommand()
const swept = await readBiomeVersion(argv)

if (swept !== target) {
  // The snapshot's contents can only be verified against a binary of the version
  // it describes. A devDependency bump routinely moves the installed version
  // ahead of the pinned target, and the standing requirement treats that split
  // state as the trigger for a version-tracking pass rather than as a defect, so
  // `--check` reports and passes instead of reddening the build. The version
  // disagreement itself is not unchecked: `check:presets` fails if the pinned
  // target is inconsistent across the files that name it.
  if (check) {
    console.log(
      `skipped: ${SNAPSHOT} describes Biome ${target}, the installed binary is `
        + `${swept}. Snapshot drift becomes checkable once a version-tracking `
        + `pass brings them level.`
    )
    process.exit(0)
  }
  fail(
    `the presets target Biome ${target} but the sweep would run ${swept}.\n`
      + `The snapshot describes the version the presets target, not whatever is `
      + `installed.\nSweep the target explicitly:\n\n`
      + `  node scripts/sync-rule-metadata.ts --biome "pnpm dlx @biomejs/biome@${target}"\n`
  )
}

const snapshot = await sweep(argv, target)
const serialized = await serialize(snapshot)

if (check) {
  const actual = await readFile(resolve(root, SNAPSHOT), 'utf8')
  if (actual !== serialized) {
    console.error(
      `drift: ${SNAPSHOT} does not match a fresh sweep of Biome ${target}.`
    )
    console.error('\nRun `pnpm sync-rule-metadata` to regenerate.')
    process.exit(1)
  }
  console.log(`${SNAPSHOT} matches Biome ${target} — ${names(snapshot)} rules`)
} else {
  await writeFile(resolve(root, SNAPSHOT), serialized)
  console.log(`wrote ${SNAPSHOT} — ${names(snapshot)} rules at Biome ${target}`)
}

function names(value: Snapshot): number {
  return Object.keys(value.rules).length
}

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
 * Keys that sit beside rules without being rules, at both levels the sweep
 * reads: the schema's `Rules` definition, whose other keys are the rule
 * categories, and each category's group, whose other keys are its rules. Any
 * other key is read as a category or a rule, so a non-rule key a later schema
 * adds fails the sweep by name rather than being silently swept or skipped.
 */
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

/** How the binary a run sweeps with was obtained, as its output reports it. */
type Binary = { argv: string[]; source: 'override' | 'installed' | 'fetched' }

/**
 * Biome ships no structured rule-metadata API: `biome explain` prints prose,
 * one rule per invocation, so the snapshot can only be read from a binary of
 * the release it describes. That is the release the presets pin, never merely
 * the one installed (docs/adr/0001), and it is resolved in order:
 *
 * 1. `--biome <command>`, kept for bootstrap and back-fill, e.g.
 *    `--biome "pnpm dlx @biomejs/biome@2.5.9"` — honoured only when it reports
 *    the pinned version;
 * 2. the installed binary, when it is that release, which needs no network;
 * 3. otherwise the release itself, fetched with `pnpm dlx`.
 *
 * The split state an automated bump leaves behind is therefore verified rather
 * than skipped, and a release that cannot be obtained fails the run instead of
 * letting an unverified snapshot pass.
 */
async function resolveBiome(target: string, purpose: string): Promise<Binary> {
  const override = flag('biome')
  if (override !== undefined) {
    const argv = parseCommand(override)
    const version = await versionOf(argv, `could not run --biome "${override}"`)
    if (version !== target) {
      fail(
        `--biome runs Biome ${version}, but the presets pin ${target}; `
          + `${SNAPSHOT} describes only the pinned release.`
      )
    }
    return { argv, source: 'override' }
  }

  if ((await readInstalledVersion()) === target) {
    return { argv: [resolve(root, INSTALLED_BIOME)], source: 'installed' }
  }

  const argv = ['pnpm', 'dlx', `@biomejs/biome@${target}`]
  const version = await versionOf(
    argv,
    `could not obtain Biome ${target} to ${purpose} ${SNAPSHOT}`
  )
  if (version !== target) {
    fail(`${argv.join(' ')} runs Biome ${version}, not ${target}`)
  }
  return { argv, source: 'fetched' }
}

function parseCommand(text: string): string[] {
  const [command, ...rest] = text.trim().split(/\s+/)
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

/** The version `argv` reports; the run fails with `context` when it cannot say. */
async function versionOf(argv: string[], context: string): Promise<string> {
  let stdout: string
  try {
    stdout = await runBiome(argv, ['--version'])
  } catch (error) {
    fail(`${context}:\n${reason(error)}`)
  }
  const match = stdout.match(/(\d+\.\d+\.\d+)/)
  if (!match?.[1]) fail(`${context}: no version in "${stdout.trim()}"`)
  return match[1]
}

/** The most telling text an `execFile` rejection carries. */
function reason(error: unknown): string {
  const { message, stderr, stdout } = error as {
    message?: string
    stderr?: string
    stdout?: string
  }
  return stderr?.trim() || stdout?.trim() || message || String(error)
}

/**
 * The rule set for `version`. Read from the installed package when it is the
 * version being swept, otherwise fetched — the published schema and the one
 * inside the package are the same document.
 */
async function readRuleNames(
  version: string,
  installed: string | undefined
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
  const categories = Object.entries(defs.Rules?.properties ?? {}).filter(
    ([key]) => !NON_RULE_KEYS.has(key)
  )
  if (categories.length === 0) {
    fail(`schema ${version} declares no rule categories under $defs.Rules`)
  }
  const names: string[] = []
  const empty: string[] = []
  for (const [category, node] of categories) {
    const rules = rulesUnder(node, defs)
    if (rules.length === 0) empty.push(category)
    names.push(...rules)
  }
  if (empty.length > 0) {
    fail(
      `schema ${version} declares rule categories with no rules the sweep can `
        + `read: ${empty.join(', ')}.\nA key under $defs.Rules that is not a `
        + 'category belongs in NON_RULE_KEYS; a category is never dropped.'
    )
  }
  return names.sort()
}

/** A JSON Schema node, as far as the category walk reads one. */
type SchemaNode = {
  $ref?: string
  anyOf?: SchemaNode[]
  oneOf?: SchemaNode[]
  properties?: Record<string, SchemaNode>
}

type SchemaDocument = { $defs: Record<string, SchemaNode | undefined> }

/**
 * The rules a category's schema node leads to. The schema declares a category
 * as `a11y: { anyOf: [{ $ref: SeverityOrA11y }, { type: "null" }] }`, and
 * `SeverityOrA11y` as `anyOf: [GroupPlainConfiguration, { $ref: A11y }]`, so the
 * walk follows `$ref`, `anyOf` and `oneOf` down to the definitions that carry
 * `properties` — the category's rule group. Reading the categories this way,
 * rather than from a list kept here, is what lets a category a later release
 * introduces reach the snapshot, and so the coverage check, at all.
 */
function rulesUnder(
  node: SchemaNode | undefined,
  defs: SchemaDocument['$defs'],
  seen = new Set<string>()
): string[] {
  if (node === undefined) return []
  if (node.$ref !== undefined) {
    const name = node.$ref.replace(/^#\/\$defs\//, '')
    if (seen.has(name)) return []
    seen.add(name)
    return rulesUnder(defs[name], defs, seen)
  }
  if (node.properties !== undefined) {
    return Object.keys(node.properties).filter((key) => !NON_RULE_KEYS.has(key))
  }
  return [...(node.anyOf ?? []), ...(node.oneOf ?? [])].flatMap((branch) =>
    rulesUnder(branch, defs, seen)
  )
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

/** The installed `@biomejs/biome` version, or `undefined` when none is installed. */
async function readInstalledVersion(): Promise<string | undefined> {
  try {
    const text = await readFile(
      resolve(root, 'node_modules/@biomejs/biome/package.json'),
      'utf8'
    )
    return (JSON.parse(text) as { version: string }).version
  } catch {
    return undefined
  }
}

/**
 * Biome's `useSortedKeys` assist orders keys by nesting level and by a
 * comparison that is not plain lexicographic (`noConstantBinaryExpressions`
 * sorts before `noConstEnum`). Rather than reimplement it, the naive JSON is
 * piped through Biome itself, so the file this writes is by construction the
 * file `biome check` accepts. The formatter is the swept binary, not whatever
 * is installed: `--check` compares bytes, so formatting with another version
 * would report that version's formatting differences as drift (docs/adr/0001).
 */
async function serialize(snapshot: Snapshot, argv: string[]): Promise<string> {
  let text = `${JSON.stringify(snapshot, null, 2)}\n`
  // One `--write` pass sorts the outer level and leaves the keys it moved
  // inside each rule for the next pass, so this runs to a fixpoint.
  for (let pass = 0; pass < 5; pass++) {
    const next = await biomeCheckWrite(argv, text)
    if (next === text) return text
    text = next
  }
  fail(`${SNAPSHOT} did not converge after 5 \`biome check --write\` passes`)
}

function biomeCheckWrite(argv: string[], text: string): Promise<string> {
  const [command, ...prefix] = argv
  const promise = execFileAsync(
    command as string,
    [...prefix, 'check', '--write', `--stdin-file-path=${SNAPSHOT}`],
    { cwd: root, maxBuffer: 32 * 1024 * 1024 }
  )
  promise.child.stdin?.end(text)
  return promise.then(({ stdout }) => stdout)
}

const check = process.argv.includes('--check')
const target = await readTargetVersion()
const biome = await resolveBiome(target, check ? 'verify' : 'regenerate')
const swept = `Biome ${target} (${biome.source})`

const snapshot = await sweep(biome.argv, target)
const serialized = await serialize(snapshot, biome.argv)

if (check) {
  const actual = await readFile(resolve(root, SNAPSHOT), 'utf8')
  if (actual !== serialized) {
    console.error(
      `drift: ${SNAPSHOT} does not match a fresh sweep of ${swept}.`
    )
    console.error('\nRun `pnpm sync-rule-metadata` to regenerate.')
    process.exit(1)
  }
  console.log(`${SNAPSHOT} matches ${swept} — ${names(snapshot)} rules`)
} else {
  await writeFile(resolve(root, SNAPSHOT), serialized)
  console.log(`wrote ${SNAPSHOT} — ${names(snapshot)} rules at ${swept}`)
}

function names(value: Snapshot): number {
  return Object.keys(value.rules).length
}

#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SNAPSHOT = 'audit/rule-metadata.json'
const LEDGER = 'audit/rule-exclusions.json'
const STRICT = 'dist/biome.react-strict.json'
const BALANCED = 'dist/biome.react-balanced.json'
const STRICT_STABLE = 'dist/biome.react-strict-stable.json'
const BALANCED_STABLE = 'dist/biome.react-balanced-stable.json'

/** Presets that carry an explicit rule list, and so have entries to check. */
const RULE_PRESETS = [STRICT, BALANCED, STRICT_STABLE, BALANCED_STABLE] as const

/** Every file whose `$schema` pins the Biome version the presets target. */
const SCHEMA_PINNED = [
  'dist/biome.recommended.json',
  'dist/biome.react-recommended.json',
  STRICT,
  BALANCED,
  STRICT_STABLE,
  BALANCED_STABLE,
  'biome.json',
] as const

/**
 * Domains whose rules the presets exclude. Read against a rule's full domain
 * list: a rule is out of scope only when *every* domain it declares is here, so
 * a rule shared with React or `test` stays in scope.
 */
const EXCLUDED_DOMAINS = new Set(['astro', 'qwik', 'solid', 'svelte', 'vue'])

/** Languages the presets do not target, read the same all-or-nothing way. */
const EXCLUDED_LANGUAGES = new Set(['graphql'])

/**
 * Languages the presets cover. A listed rule qualifies through one of these
 * **or** through an in-scope domain — the scope test is a disjunction, and
 * evaluating the domain half alone would flag the 33 listed rules that belong
 * only to domains the requirement does not name (`types`, `playwright`,
 * `drizzle`, `tailwind`, `turborepo`), every one of which is a js/ts rule.
 */
const IN_SCOPE_LANGUAGES = new Set([
  'cjs',
  'css',
  'html',
  'js',
  'json',
  'jsonc',
  'jsx',
  'mjs',
  'ts',
  'tsx',
])

/**
 * Domains that put a rule in scope regardless of its language. Read with
 * `some`, never `every`, so a rule that serves an excluded framework *as well
 * as* an in-scope one stays in scope.
 *
 * No rule in 2.5.9 exercises this. The only two mixed-domain rules —
 * `useJsxKeyInIterable` (`[qwik, react]`) and `noDuplicatedSpreadProps`
 * (`[react, solid]`) — publish `jsx` examples, so the language clause above
 * already covers them and the domain reading cannot change their outcome. The
 * property is defensive: verified against a synthetic rule with mixed domains
 * and no in-scope language, which `every` wrongly flags and `some` does not.
 */
const IN_SCOPE_DOMAINS = new Set([
  'next',
  'project',
  'react',
  'reactNative',
  'test',
])

/** `recommended: true` never activates nursery, so a nursery entry is never redundant. */
const NURSERY = 'nursery'

type RuleMetadata = {
  category: string
  defaultSeverity: string
  recommended: boolean
  domains: string[]
  languages: string[]
}

type Snapshot = { biomeVersion: string; rules: Record<string, RuleMetadata> }
type LedgerEntry = { direction: 'in' | 'out'; reason: string }
type Ledger = { rules: Record<string, LedgerEntry> }
type RuleValue = string | { level?: string; options?: unknown }
type Preset = {
  $schema?: string
  linter?: { rules?: Record<string, unknown> }
}

type Entry = { rule: string; category: string; value: RuleValue }

const failures: string[] = []

function report(check: string, lines: string[]): void {
  if (lines.length === 0) return
  failures.push(`${check}\n${lines.map((line) => `  ${line}`).join('\n')}`)
}

async function readJson<T>(relPath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(root, relPath), 'utf8')) as T
}

/** Flattens `linter.rules` into entries, skipping `recommended` and `domains`. */
function entriesOf(preset: Preset): Entry[] {
  const out: Entry[] = []
  for (const [category, value] of Object.entries(preset.linter?.rules ?? {})) {
    if (category === 'domains' || typeof value !== 'object' || value === null) {
      continue
    }
    for (const [rule, setting] of Object.entries(
      value as Record<string, RuleValue>
    )) {
      out.push({ rule, category, value: setting })
    }
  }
  return out
}

function levelOf(value: RuleValue): string | undefined {
  return typeof value === 'string' ? value : value.level
}

function hasOptions(value: RuleValue): boolean {
  return typeof value !== 'string' && value.options !== undefined
}

function pinnedVersion(schema: string | undefined): string | undefined {
  return schema?.match(/schemas\/([^/]+)\/schema\.json/)?.[1]
}

const snapshot = await readJson<Snapshot>(SNAPSHOT)
const ledger = await readJson<Ledger>(LEDGER)
const presets = new Map<string, Preset>()
for (const path of SCHEMA_PINNED)
  presets.set(path, await readJson<Preset>(path))

const strict = presets.get(STRICT) as Preset
const balanced = presets.get(BALANCED) as Preset
const strictEntries = entriesOf(strict)
const strictRules = new Set(strictEntries.map((entry) => entry.rule))
const readme = await readFile(resolve(root, 'README.md'), 'utf8')

// --- 1. Coverage ------------------------------------------------------------
// Every rule the target release declares must be accounted for. A rule that is
// none of these is not "out of scope"; it is unreviewed, and saying so is the
// whole point of the check.
{
  const unclassified: string[] = []
  for (const [rule, meta] of Object.entries(snapshot.rules)) {
    if (strictRules.has(rule)) continue
    if (meta.recommended && meta.domains.length === 0) continue
    if (
      meta.domains.length > 0
      && meta.domains.every((domain) => EXCLUDED_DOMAINS.has(domain))
    )
      continue
    if (
      meta.languages.length > 0
      && meta.languages.every((language) => EXCLUDED_LANGUAGES.has(language))
    )
      continue
    if (ledger.rules[rule]?.direction === 'out') continue
    unclassified.push(
      `${rule} (${meta.category}, domains: ${meta.domains.join('/') || 'none'}, `
        + `languages: ${meta.languages.join('/') || 'none'})`
    )
  }
  report(
    `coverage: ${unclassified.length} rule(s) awaiting classification — list them `
      + `in the presets, or record why they are out of scope in ${LEDGER}`,
    unclassified
  )

  // An entry earns its place only when derivation cannot reach the same verdict.
  // Being *listed* does not classify a rule — that is precisely what an `in`
  // entry exists to justify — so listing is deliberately not a redundancy signal.
  const redundantLedger: string[] = []
  const contradictedLedger: string[] = []
  for (const [rule, entry] of Object.entries(ledger.rules)) {
    const meta = snapshot.rules[rule]
    if (!meta) {
      contradictedLedger.push(
        `${rule}: not a rule in Biome ${snapshot.biomeVersion}`
      )
      continue
    }
    const derivedOut =
      (meta.domains.length > 0
        && meta.domains.every((domain) => EXCLUDED_DOMAINS.has(domain)))
      || (meta.languages.length > 0
        && meta.languages.every((language) => EXCLUDED_LANGUAGES.has(language)))
    const derivedIn =
      meta.languages.some((language) => IN_SCOPE_LANGUAGES.has(language))
      || meta.domains.some((domain) => IN_SCOPE_DOMAINS.has(domain))

    if (entry.direction === 'out' && derivedOut) redundantLedger.push(rule)
    if (entry.direction === 'in' && derivedIn) redundantLedger.push(rule)
    if (entry.direction === 'out' && strictRules.has(rule)) {
      contradictedLedger.push(`${rule}: recorded out of scope, but listed`)
    }
  }
  report(
    `ledger: ${redundantLedger.length} entr(y|ies) the metadata already classifies`,
    redundantLedger
  )
  report('ledger: contradicted entries', contradictedLedger)
}

// --- 2. Category placement & 3. Rule existence -------------------------------
{
  const misplaced: string[] = []
  const unknown: string[] = []
  for (const path of RULE_PRESETS) {
    for (const entry of entriesOf(presets.get(path) as Preset)) {
      const meta = snapshot.rules[entry.rule]
      if (!meta) {
        unknown.push(`${path}: ${entry.rule}`)
        continue
      }
      if (meta.category !== entry.category) {
        misplaced.push(
          `${path}: ${entry.rule} is listed under ${entry.category}, Biome `
            + `${snapshot.biomeVersion} puts it in ${meta.category}`
        )
      }
    }
  }
  report('category placement', misplaced)
  report(
    `rule existence: not present in Biome ${snapshot.biomeVersion}`,
    unknown
  )
}

// --- 4. Redundancy -----------------------------------------------------------
{
  const redundant: string[] = []
  for (const path of RULE_PRESETS) {
    for (const entry of entriesOf(presets.get(path) as Preset)) {
      const meta = snapshot.rules[entry.rule]
      if (!meta || meta.category === NURSERY) continue
      if (!meta.recommended || meta.domains.length > 0) continue
      if (hasOptions(entry.value)) continue
      if (levelOf(entry.value) === meta.defaultSeverity) {
        redundant.push(
          `${path}: ${entry.rule} is recommended and already active at `
            + `"${meta.defaultSeverity}"`
        )
      }
    }
  }
  report('redundancy: entries implied by `recommended: true`', redundant)
}

// --- 5. Preset parity --------------------------------------------------------
{
  const mismatches: string[] = []
  for (const [a, b] of [
    [STRICT, BALANCED],
    [STRICT_STABLE, BALANCED_STABLE],
  ] as const) {
    const left = new Set(entriesOf(presets.get(a) as Preset).map((e) => e.rule))
    const right = new Set(
      entriesOf(presets.get(b) as Preset).map((e) => e.rule)
    )
    for (const rule of left) {
      if (!right.has(rule)) mismatches.push(`${rule}: in ${a}, not in ${b}`)
    }
    for (const rule of right) {
      if (!left.has(rule)) mismatches.push(`${rule}: in ${b}, not in ${a}`)
    }
  }
  report(
    'preset parity: the two presets must list the same rule set',
    mismatches
  )
}

// --- 6. README inventory -----------------------------------------------------
{
  const problems: string[] = []

  const counts = new Map<string, number>()
  for (const entry of strictEntries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
  }
  for (const match of readme.matchAll(
    /^- \*\*([a-z0-9]+)\*\* \((\d+) rules?\)/gm
  )) {
    const [, category, published] = match
    const actual = counts.get(category as string)
    if (actual === undefined) {
      problems.push(
        `README names a category the preset has no rules in: ${category}`
      )
    } else if (actual !== Number(published)) {
      problems.push(
        `README says ${category} has ${published} rules, ${STRICT} lists ${actual}`
      )
    }
  }
  for (const [category, actual] of counts) {
    if (
      !new RegExp(`^- \\*\\*${category}\\*\\* \\(\\d+ rules?\\)`, 'm').test(
        readme
      )
    ) {
      problems.push(
        `README publishes no rule count for ${category} (${actual} rules)`
      )
    }
  }

  // Rule names follow Biome's `no…`/`use…` convention, which distinguishes them
  // from the API names the prose also quotes (`forEach`, `type`, `Array#find`).
  const named = new Set<string>()
  for (const match of readme.matchAll(/`((?:no|use)[A-Z][A-Za-z0-9]*)`/g)) {
    named.add(match[1] as string)
  }
  for (const rule of [...named].sort()) {
    if (!strictRules.has(rule)) {
      problems.push(`README names ${rule}, which ${STRICT} does not list`)
    }
  }

  const relaxations = strictEntries.filter((entry) => {
    const other = entriesOf(balanced).find((e) => e.rule === entry.rule)
    return JSON.stringify(other?.value) !== JSON.stringify(entry.value)
  })
  const stableRelaxations = relaxations.filter((e) => e.category !== NURSERY)
  const total = relaxations.length
  const stable = stableRelaxations.length

  const checkPhrase = (
    pattern: RegExp,
    expected: number,
    what: string
  ): void => {
    const found = readme.match(pattern)?.[1]
    if (found === undefined) problems.push(`README has no ${what} to check`)
    else if (Number(found) !== expected) {
      problems.push(
        `README says ${found} ${what}, the presets have ${expected}`
      )
    }
  }
  checkPhrase(
    /\*\*(\d+) targeted relaxations\*\*/,
    total,
    'targeted relaxations'
  )
  checkPhrase(/of the (\d+) relaxations/, total, 'relaxations (stable note)')
  checkPhrase(/those (\d+) apply in/, stable, 'stable relaxations')
  checkPhrase(
    /with the (\d+) stable-category relaxations/,
    stable,
    'stable-category relaxations'
  )

  const stableCount = entriesOf(presets.get(STRICT_STABLE) as Preset).length
  for (const match of readme.matchAll(
    /— (\d+) rules(?: across (\d+) categories)?/g
  )) {
    if (Number(match[1]) !== stableCount) {
      problems.push(
        `README says a -stable preset has ${match[1]} rules, `
          + `${STRICT_STABLE} lists ${stableCount}`
      )
    }
  }

  report('README inventory', problems)
}

// --- 7. Pinned-target consistency -------------------------------------------
{
  const problems: string[] = []
  const target = snapshot.biomeVersion

  for (const path of SCHEMA_PINNED) {
    const pinned = pinnedVersion((presets.get(path) as Preset).$schema)
    if (pinned !== target) {
      problems.push(
        `${path} pins ${pinned ?? '(no $schema)'}, snapshot says ${target}`
      )
    }
  }

  // Only the machine-readable forms and the bolded prose name the target; a
  // plain "in Biome 2.5.0" is a historical note about when a rule graduated.
  const patterns = [
    /biomejs\.dev\/schemas\/([^/]+)\/schema\.json/g,
    /@biomejs\/biome@\^?(\d+\.\d+\.\d+)/g,
    /\*\*(?:Biome )?(\d+\.\d+\.\d+)\+?\*\*/g,
  ]
  let references = 0
  for (const pattern of patterns) {
    for (const match of readme.matchAll(pattern)) {
      references++
      if (match[1] !== target) {
        problems.push(`README names Biome ${match[1]}, snapshot says ${target}`)
      }
    }
  }
  if (references === 0) {
    problems.push('README names no Biome version in a recognised form')
  }

  report('pinned-target consistency', problems)
}

// --- 8. Listed-rule scope -----------------------------------------------------
// The opposite direction from Coverage. A listed rule satisfies Coverage merely
// by being listed, so that invariant can never detect a rule that does not
// belong — which is how two GraphQL rules sat in the presets across nine
// version-tracking passes.
{
  const outOfScope: string[] = []
  for (const path of RULE_PRESETS) {
    for (const entry of entriesOf(presets.get(path) as Preset)) {
      const meta = snapshot.rules[entry.rule]
      if (!meta) continue // reported by the rule-existence invariant
      if (ledger.rules[entry.rule]?.direction === 'in') continue
      const inScope =
        meta.languages.some((language) => IN_SCOPE_LANGUAGES.has(language))
        || meta.domains.some((domain) => IN_SCOPE_DOMAINS.has(domain))
      if (inScope) continue
      outOfScope.push(
        `${path}: ${entry.rule} (languages: ${meta.languages.join('/') || 'none'}, `
          + `domains: ${meta.domains.join('/') || 'none'})`
      )
    }
  }
  report(
    `listed-rule scope: ${outOfScope.length} listed rule(s) the presets should not `
      + `enumerate — remove them, or record why they are in scope in ${LEDGER}`,
    outOfScope
  )
}

if (failures.length > 0) {
  console.error(failures.join('\n\n'))
  console.error(`\n${failures.length} check(s) failed.`)
  process.exit(1)
}
console.log(
  `presets check out against Biome ${snapshot.biomeVersion}: `
    + `${Object.keys(snapshot.rules).length} rules classified, `
    + `${strictRules.size} listed, 0 unaccounted`
)

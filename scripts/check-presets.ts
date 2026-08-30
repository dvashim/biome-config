#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SNAPSHOT = 'audit/rule-metadata.json'
const LEDGER = 'audit/rule-exclusions.json'
const PACKAGE = 'package.json'
const STRICT = 'dist/biome.react-strict.json'
const BALANCED = 'dist/biome.react-balanced.json'
const STRICT_STABLE = 'dist/biome.react-strict-stable.json'
const BALANCED_STABLE = 'dist/biome.react-balanced-stable.json'

/** Presets that carry an explicit rule list, and so have entries to check. */
const RULE_PRESETS = [STRICT, BALANCED, STRICT_STABLE, BALANCED_STABLE] as const

/** The repo's own config, which pins the target but is not a published preset. */
const ROOT_CONFIG = 'biome.json'

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

/**
 * Header cells of the two count columns in the README's Configurations table.
 * The table is located by these rather than by position, so reordering a column
 * cannot silently misalign the read.
 */
const RULES_COLUMN = 'Explicit rules'
const NURSERY_COLUMN = 'Nursery'

type RuleMetadata = {
  category: string
  defaultSeverity: string
  recommended: boolean
  domains: string[]
  languages: string[]
}

type Snapshot = { biomeVersion: string; rules: Record<string, RuleMetadata> }
type PackageJson = { name: string; exports: Record<string, string> }
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

function fail(): never {
  console.error(failures.join('\n\n'))
  console.error(`\n${failures.length} check(s) failed.`)
  process.exit(1)
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

/** Cells of a markdown table row, less the empties the outer pipes produce. */
function tableCells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())
}

/**
 * The README's Configurations table, found by its count-column headers. Returns
 * `undefined` when no table carries them — the caller reports that as a failure
 * rather than as "nothing to check", because a check that quietly finds nothing
 * to compare is the defect this invariant exists to prevent.
 */
function findConfigTable(
  md: string
): { columns: string[]; rows: string[][] } | undefined {
  const lines = md.split('\n')
  for (const [index, line] of lines.entries()) {
    if (!line.startsWith('|')) continue
    const columns = tableCells(line)
    if (!columns.includes(RULES_COLUMN)) continue
    if (!columns.includes(NURSERY_COLUMN)) continue
    const rows: string[][] = []
    // +2 steps over the `|---|---|` separator that follows every header row.
    for (const row of lines.slice(index + 2)) {
      if (!row.startsWith('|')) break
      rows.push(tableCells(row))
    }
    return { columns, rows }
  }
  return undefined
}

/** Every integer a table cell publishes, in order: `264, 18 relaxed` -> [264, 18]. */
function publishedCounts(cell: string): number[] {
  return [...cell.matchAll(/\d+/g)].map((match) => Number(match[0]))
}

const snapshot = await readJson<Snapshot>(SNAPSHOT)
const ledger = await readJson<Ledger>(LEDGER)
const pkg = await readJson<PackageJson>(PACKAGE)

/**
 * `@dvashim/biome-config/react-strict` -> `dist/biome.react-strict.json`. The
 * exports map is what makes a preset reachable, so it is the authority on which
 * presets are published and therefore have to be checked and documented.
 */
const publishedPresets = new Map<string, string>()
for (const [subpath, target] of Object.entries(pkg.exports)) {
  const specifier =
    subpath === '.' ? pkg.name : `${pkg.name}${subpath.slice(1)}`
  publishedPresets.set(specifier, target.replace(/^\.\//, ''))
}

/**
 * Every file whose `$schema` pins the Biome version the presets target: each
 * published preset, plus the root config. Derived rather than listed, because a
 * second hand-maintained list is one the export map can outgrow — and the checks
 * would then index a map that never loaded the new preset.
 */
const SCHEMA_PINNED = [...new Set(publishedPresets.values()), ROOT_CONFIG]

// Parity, the relaxation counts and the -stable totals all name a specific
// preset, so these four paths stay hand-written where the rest of the list is
// derived. A rename in the export map would leave them pointing at nothing.
{
  const published = new Set(publishedPresets.values())
  report(
    'preset paths: a check names a preset the package does not publish',
    RULE_PRESETS.filter((path) => !published.has(path))
  )
  // Every invariant below dereferences these by name, so there is nothing left
  // to check past this point — report and stop, rather than continue into a
  // guaranteed undefined.
  if (failures.length > 0) fail()
}

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
  // The ladder bullet publishes react-strict's total in prose, well away from
  // the table that publishes it again. Both are checked; neither stands in for
  // the other.
  checkPhrase(
    /up to (\d+) explicitly configured rules/,
    strictEntries.length,
    'explicitly configured rules in the ladder bullet'
  )

  // The Configurations table is the README's published inventory of the ladder.
  // Read it structurally — count columns located by header name, each row keyed
  // by the `extends` specifier it already carries — because the totals that
  // drifted (`| 264 | 82 |`, `| 182 | — |`) are bare cells with no surrounding
  // words for a text matcher to anchor on. Reconciling the per-category counts
  // above is not evidence for these: they are published in a different place, in
  // a different shape, and a change can update one and leave the other stale.
  const relaxedByPreset = new Map([
    [BALANCED, total],
    [BALANCED_STABLE, stable],
  ])
  const table = findConfigTable(readme)
  if (table === undefined) {
    problems.push(
      `README has no Configurations table with "${RULES_COLUMN}" and `
        + `"${NURSERY_COLUMN}" columns to check`
    )
  } else {
    const rulesAt = table.columns.indexOf(RULES_COLUMN)
    const nurseryAt = table.columns.indexOf(NURSERY_COLUMN)
    const documented = new Set<string>()
    for (const cells of table.rows) {
      const specifier = cells
        .map((cell) => cell.match(/`([^`]+)`/)?.[1])
        .find((value) => value?.startsWith(pkg.name))
      if (specifier === undefined) {
        problems.push(
          `README table row publishes no ${pkg.name} extends path: ${cells[0]}`
        )
        continue
      }
      const path = publishedPresets.get(specifier)
      if (path === undefined) {
        problems.push(
          `README table documents ${specifier}, which package.json does not export`
        )
        continue
      }
      documented.add(path)

      // Unreachable while the pinned-file list is derived from this same export
      // map. Kept because a cast here is what turned a disagreement between the
      // two into a stack trace instead of a finding, and the next caller to index
      // this map from a different list should get a message, not a crash.
      const preset = presets.get(path)
      if (preset === undefined) {
        problems.push(
          `${path} is exported but was not loaded — the pinned-file list and `
            + 'the export map disagree'
        )
        continue
      }
      const entries = entriesOf(preset)
      const nursery = entries.filter((e) => e.category === NURSERY).length
      const relaxed = relaxedByPreset.get(path) ?? 0
      const published = publishedCounts(cells[rulesAt] ?? '')

      if (entries.length === 0) {
        if (published.length > 0) {
          problems.push(
            `README table publishes ${published[0]} explicit rules for ${path}, `
              + 'which lists none'
          )
        }
      } else if (published[0] !== entries.length) {
        problems.push(
          `README table says ${path} has ${published[0] ?? 'no'} explicit rules, `
            + `it lists ${entries.length}`
        )
      }

      if (relaxed > 0 && published[1] !== relaxed) {
        problems.push(
          `README table says ${path} relaxes ${published[1] ?? 'no'} rules, `
            + `it relaxes ${relaxed}`
        )
      }
      if (relaxed === 0 && published.length > 1) {
        problems.push(
          `README table publishes a relaxation count for ${path}, which relaxes none`
        )
      }

      const publishedNursery = publishedCounts(cells[nurseryAt] ?? '')
      if (nursery === 0) {
        if (publishedNursery.length > 0) {
          problems.push(
            `README table publishes ${publishedNursery[0]} nursery rules for `
              + `${path}, which lists none`
          )
        }
      } else if (publishedNursery[0] !== nursery) {
        problems.push(
          `README table says ${path} has ${publishedNursery[0] ?? 'no'} nursery `
            + `rules, it lists ${nursery}`
        )
      }
    }
    for (const path of new Set(publishedPresets.values())) {
      if (!documented.has(path)) {
        problems.push(`README table has no row for ${path}, which is published`)
      }
    }
  }

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

if (failures.length > 0) fail()
console.log(
  `presets check out against Biome ${snapshot.biomeVersion}: `
    + `${Object.keys(snapshot.rules).length} rules classified, `
    + `${strictRules.size} listed, 0 unaccounted`
)

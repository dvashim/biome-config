#!/usr/bin/env node
// intent-gate.mjs - enforces the approval gate of the intent-first OpenSpec schema.
//
// 1) Claude Code PreToolUse hook (matcher: Write|Edit|MultiEdit). Exits 2 to block:
//    - writing proposal.md, specs/, design.md, adr.md or tasks.md of an intent-first
//      change whose intent is not accepted (in slice mode: the linked shared intent);
//    - an agent write that sets an intent's Status to accepted - only humans accept;
//    - any agent write to an intent that is already accepted - accepted means frozen.
//
// 2) CI / pre-commit check: node .claude/hooks/intent-gate.mjs --check [repo-root]
//    Exits 1 if an active intent-first change has artifacts but no accepted intent.
//    It also catches what the hook can't see: Bash/PowerShell writes and human edits.
//
// Zero dependencies. Node 18+.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const GATED_SCHEMAS = new Set(['intent-first']) // schemas this gate applies to
const INTENTS_DIR = 'docs/intents' // shared intents (slice mode), relative to repo root
const GATED_ARTIFACTS = [
  'proposal.md',
  'design.md',
  'adr.md',
  'tasks.md',
  'specs',
]

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const read = (file) => {
  try {
    return statSync(file).isFile() ? readFileSync(file, 'utf8') : ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------- parsing

const stripNonContent = (md) =>
  md.replace(/<!--[\s\S]*?-->/g, '').replace(/^(```|~~~)[\s\S]*?^\1/gm, '')

// Values of "Status" lines, e.g. "- **Status**: accepted" or "Status: draft".
function statuses(md) {
  const found = []
  for (const line of stripNonContent(md).split(/\r?\n/)) {
    const m = line.match(
      /^\s*(?:[-*+]\s+)?(?:\*\*|__)?status(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*([a-z][a-z-]*)/i
    )
    if (m) found.push(m[1].toLowerCase())
  }
  return found
}
const isAccepted = (md) => {
  const s = statuses(md)
  return s.length > 0 && s.every((v) => v === 'accepted')
}
const claimsAccepted = (md) => statuses(md).includes('accepted')

// Shared intents a change's intent.md links to (slice mode).
function sharedIntentRefs(md) {
  const re = new RegExp(`${escapeRe(INTENTS_DIR)}/([A-Za-z0-9._-]+\\.md)`, 'g')
  return [
    ...new Set(
      [...stripNonContent(md).matchAll(re)].map((m) => `${INTENTS_DIR}/${m[1]}`)
    ),
  ]
}

const schemaIn = (file) => read(file).match(/^schema:\s*['"]?([^'"\s#]+)/m)?.[1]
// Same resolution order as OpenSpec: change metadata, then project config, then default.
const schemaOf = (root, change) =>
  schemaIn(join(root, 'openspec', 'changes', change, '.openspec.yaml'))
  ?? schemaIn(join(root, 'openspec', 'config.yaml'))
  ?? 'spec-driven'
const isGatedChange = (root, change) =>
  GATED_SCHEMAS.has(schemaOf(root, change))
const repoUsesGate = (root) =>
  GATED_SCHEMAS.has(schemaIn(join(root, 'openspec', 'config.yaml')))
  || [...GATED_SCHEMAS].some((s) =>
    existsSync(join(root, 'openspec', 'schemas', s))
  )

// ------------------------------------------------------------------ rules

// Why this change's intent does not count as accepted; empty when it does.
function intentProblems(root, change) {
  const rel = `openspec/changes/${change}/intent.md`
  const local = read(join(root, rel))
  if (!local.trim()) return [`${rel} is missing - write the intent first.`]

  const problems = []
  const own = statuses(local)
  const refs = sharedIntentRefs(local)
  if (own.length && !isAccepted(local)) {
    problems.push(`${rel} is not accepted (Status: ${own.join(', ')}).`)
  }
  if (!own.length && !refs.length) {
    problems.push(
      `${rel} has no Status line and links no shared intent in ${INTENTS_DIR}/.`
    )
  }
  for (const ref of refs) {
    const shared = read(join(root, ref))
    if (!shared.trim())
      problems.push(`${ref}, linked from ${rel}, does not exist.`)
    else if (!isAccepted(shared)) {
      problems.push(
        `${ref} is not accepted (Status: ${statuses(shared).join(', ') || 'none'}).`
      )
    }
  }
  return problems
}

// What the file will contain after the tool call.
function nextContent(current, input) {
  if (typeof input.content === 'string') return input.content // Write
  let text = current
  for (const e of Array.isArray(input.edits) ? input.edits : [input]) {
    const from = e.old_string ?? ''
    const to = e.new_string ?? ''
    if (from === '')
      text += to // Edit creating a file
    else
      text = e.replace_all
        ? text.split(from).join(to)
        : text.replace(from, () => to)
  }
  return text
}

function classify(absPath) {
  const p = absPath.replace(/\\/g, '/')
  let m = p.match(/^(.*)\/openspec\/changes\/([^/]+)\/(.+)$/)
  if (m) {
    const [, root, change, rel] = m
    if (change === 'archive') return null
    if (rel === 'intent.md') {
      return {
        kind: 'intent',
        root,
        change,
        file: absPath,
        label: `openspec/changes/${change}/intent.md`,
      }
    }
    if (GATED_ARTIFACTS.includes(rel.split('/')[0])) {
      return {
        kind: 'artifact',
        root,
        change,
        label: `openspec/changes/${change}/${rel}`,
      }
    }
    return null
  }
  m = p.match(new RegExp(`^(.*)/${escapeRe(INTENTS_DIR)}/([^/]+\\.md)$`))
  if (m)
    return {
      file: absPath,
      kind: 'shared-intent',
      label: `${INTENTS_DIR}/${m[2]}`,
      root: m[1],
    }
  return null
}

// Reason to block, or null to stay out of the way.
function decide(target, input) {
  if (
    target.kind === 'shared-intent'
      ? !repoUsesGate(target.root)
      : !isGatedChange(target.root, target.change)
  ) {
    return null
  }

  if (target.kind === 'artifact') {
    const problems = intentProblems(target.root, target.change)
    if (!problems.length) return null
    return [
      `intent-gate: blocked writing ${target.label} because the intent for this change is not accepted:`,
      ...problems.map((p) => `  - ${p}`),
      'Stop here. Ask the approver to review the intent and set "Status: accepted" in the file themselves, then continue.',
    ].join('\n')
  }

  const current = read(target.file)
  if (isAccepted(current)) {
    return (
      `intent-gate: blocked editing ${target.label}: it is accepted, so it is frozen. `
      + 'Only a human may change it, for example by setting Status back to draft first. '
      + 'Tell the user what needs revising and why.'
    )
  }
  if (claimsAccepted(nextContent(current, input))) {
    return (
      `intent-gate: blocked writing ${target.label}: only a human can accept an intent. `
      + 'Keep "Status: draft" and ask the approver to change it in the file themselves. '
      + "In slice mode, do not copy the shared intent's status; link it under Source intent."
    )
  }
  return null
}

// ------------------------------------------------------------ entry points

async function hookMain() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk

  let input
  try {
    input = JSON.parse(raw)
  } catch {
    return 0 // not a payload we understand: stay out of the way
  }
  const toolInput = input?.tool_input ?? {}
  if (typeof toolInput.file_path !== 'string') return 0

  const target = classify(
    resolve(input.cwd ?? process.cwd(), toolInput.file_path)
  )
  if (!target) return 0 // not an OpenSpec change artifact or intent: fast path

  try {
    const reason = decide(target, toolInput)
    if (!reason) return 0
    process.stderr.write(`${reason}\n`)
    return 2
  } catch (err) {
    process.stderr.write(
      `intent-gate: could not check ${target.label} (${err.message}); blocking to be safe.\n`
    )
    return 2
  }
}

function checkMain(rootArg) {
  const root = resolve(rootArg ?? process.cwd())
  const changesDir = join(root, 'openspec', 'changes')
  if (!existsSync(changesDir)) {
    console.log('intent-gate: no openspec/changes directory, nothing to check.')
    return 0
  }

  const failures = []
  let checked = 0
  for (const change of readdirSync(changesDir)) {
    const dir = join(changesDir, change)
    if (
      change === 'archive'
      || !statSync(dir).isDirectory()
      || !isGatedChange(root, change)
    )
      continue
    if (!GATED_ARTIFACTS.some((f) => existsSync(join(dir, f)))) continue
    checked += 1
    for (const problem of intentProblems(root, change))
      failures.push(`${change}: ${problem}`)
  }

  if (failures.length) {
    console.error(
      'intent-gate: intent-first changes have artifacts without an accepted intent:'
    )
    for (const f of failures) console.error(`  - ${f}`)
    return 1
  }
  console.log(
    `intent-gate: ok, ${checked} intent-first change(s) with artifacts checked.`
  )
  return 0
}

const [mode, arg] = process.argv.slice(2)
process.exit(mode === '--check' ? checkMain(arg) : await hookMain())

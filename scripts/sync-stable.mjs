#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PAIRS = [
  ['dist/biome.react-strict.json', 'dist/biome.react-strict-stable.json'],
  ['dist/biome.react-balanced.json', 'dist/biome.react-balanced-stable.json'],
]

const execFileAsync = promisify(execFile)

function biomeFormat(text, virtualPath) {
  const promise = execFileAsync(
    'pnpm',
    ['exec', 'biome', 'format', `--stdin-file-path=${virtualPath}`],
    { cwd: root }
  )
  promise.child.stdin.end(text)
  return promise.then(({ stdout }) => stdout)
}

function addSectionBreaks(text) {
  const lines = text.split('\n')
  const out = []
  for (const line of lines) {
    if (
      /^ {2}"[^"]+":/.test(line)
      && out.length > 0
      && out.at(-1) !== ''
      && out.at(-1) !== '{'
    ) {
      out.push('')
    }
    out.push(line)
  }
  return out.join('\n')
}

async function deriveStable(srcAbs, destAbs) {
  const obj = JSON.parse(await readFile(srcAbs, 'utf8'))
  delete obj.linter?.rules?.nursery
  const naive = `${JSON.stringify(obj, null, 2)}\n`
  const formatted = await biomeFormat(naive, relative(root, destAbs))
  return addSectionBreaks(formatted)
}

const check = process.argv.includes('--check')
let drift = false

for (const [srcRel, destRel] of PAIRS) {
  const src = resolve(root, srcRel)
  const dest = resolve(root, destRel)
  const expected = await deriveStable(src, dest)
  if (check) {
    const actual = await readFile(dest, 'utf8')
    if (actual !== expected) {
      console.error(`drift: ${destRel} is out of sync with ${srcRel}`)
      drift = true
    }
  } else {
    await writeFile(dest, expected)
    console.log(`wrote ${destRel}`)
  }
}

if (drift) {
  console.error('\nRun `pnpm sync-stable` to regenerate.')
  process.exit(1)
}

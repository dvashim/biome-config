#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PAIRS = [
  ['dist/biome.react-strict.json', 'dist/biome.react-strict-stable.json'],
  ['dist/biome.react-balanced.json', 'dist/biome.react-balanced-stable.json'],
]

function biomeFormat(text, virtualPath) {
  return new Promise((res, rej) => {
    const child = spawn(
      'pnpm',
      ['exec', 'biome', 'format', `--stdin-file-path=${virtualPath}`],
      { cwd: root }
    )
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d
    })
    child.stderr.on('data', (d) => {
      stderr += d
    })
    child.on('error', rej)
    child.on('exit', (code) => {
      if (code === 0) res(stdout)
      else rej(new Error(`biome format exited ${code}\n${stderr}`))
    })
    child.stdin.write(text)
    child.stdin.end()
  })
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
  if (obj.linter?.rules?.nursery !== undefined) {
    delete obj.linter.rules.nursery
  }
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

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

test('compiled API starts without TypeScript sources and requires a session', () => {
  const root = resolve(fileURLToPath(new URL('../', import.meta.url)))
  const cache = join(root, 'node_modules', '.cache')
  mkdirSync(cache, { recursive: true })
  const output = mkdtempSync(join(cache, 'lumemon-api-'))
  try {
    const configPath = join(root, 'tsconfig.json')
    const config = ts.readConfigFile(configPath, ts.sys.readFile)
    assert.equal(config.error, undefined)
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
    const program = ts.createProgram([join(root, 'api', 'battle.ts')], {
      ...parsed.options,
      noEmit: false,
      noCheck: true,
      rootDir: root,
      outDir: output,
    })
    assert.equal(program.emit().emitSkipped, false)
    writeFileSync(join(output, 'package.json'), JSON.stringify({ type: 'module' }))
    const entry = pathToFileURL(join(output, 'api', 'battle.js')).href
    const script = [
      "import assert from 'node:assert/strict'",
      'const { POST, GET } = await import(' + JSON.stringify(entry) + ')',
      "const response = await POST(new Request('https://example.invalid/api/battle', { method: 'POST' }))",
      'assert.equal(response.status, 401)',
      "assert.deepEqual(await response.json(), { error: 'identity' })",
      "assert.equal(response.headers.get('cache-control'), 'no-store')",
      "assert.equal((await GET(new Request('https://example.invalid/api/battle'))).status, 405)",
    ].join(';\n')
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
      env: {
        ...process.env,
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SECRET_KEY: 'sb_secret_compilation_test_only',
      },
    })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 0, result.stderr)
  } finally {
    // Only remove the unique build directory created by this test.
    assert.equal(dirname(resolve(output)), cache)
    rmSync(output, { recursive: true, force: true })
  }
})

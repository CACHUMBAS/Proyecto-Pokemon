import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'

export async function cachedText(
  directory: string,
  key: string,
  load: () => Promise<string>,
  validate: (value: string) => void,
  refresh = false,
): Promise<string> {
  if (!/^[a-zA-Z0-9_.-]+$/.test(key)) throw new Error('Invalid cache key')
  await mkdir(directory, { recursive: true })
  const path = join(directory, key)
  if (!refresh) {
    try {
      if (Date.now() - (await stat(path)).mtimeMs < 7 * 24 * 60 * 60 * 1000) {
        const value = (await readFile(path, 'utf8')).replace(/^\uFEFF/, '')
        validate(value)
        return value
      }
    } catch {
      /* Missing, expired or invalid cache is fetched again. */
    }
  }
  const value = await load()
  validate(value)
  const temporary = `${path}.${randomUUID()}.tmp`
  await writeFile(temporary, value)
  await rename(temporary, path)
  return value
}
async function writeAtomically(path: string, value: string): Promise<void> {
  try {
    if ((await readFile(path, 'utf8')) === value) return
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const temporary = path + '.' + randomUUID() + '.tmp'
  try {
    await writeFile(temporary, value)
    await rename(temporary, path)
  } finally {
    await unlink(temporary).catch(() => {})
  }
}

export async function publishSnapshot(
  directory: string,
  manifest: unknown,
  files: Record<string, unknown>,
): Promise<void> {
  const root = resolve(directory)
  const serialized = Object.entries(files).map(([name, value]) => {
    const path = resolve(root, name)
    if (!path.startsWith(root + sep) || name === 'manifest.json')
      throw new Error('Invalid snapshot path')
    return [path, JSON.stringify(value)] as const
  })
  const manifestText = JSON.stringify(manifest)
  for (const [path, value] of serialized) {
    await mkdir(resolve(path, '..'), { recursive: true })
    await writeAtomically(path, value)
  }
  await mkdir(root, { recursive: true })
  await writeAtomically(join(root, 'manifest.json'), manifestText)
}

import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
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
    await writeFile(path, value)
  }
  await mkdir(root, { recursive: true })
  const temporary = join(root, `manifest-${randomUUID()}.tmp`)
  await writeFile(temporary, manifestText)
  await rename(temporary, join(root, 'manifest.json'))
}

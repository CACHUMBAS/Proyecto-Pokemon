import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { loadSources, loadCatalog, ensure } from './sources.ts'
import type { Selection } from './sources.ts'
import { buildRoster } from './build-roster.ts'
const root = fileURLToPath(new URL('../../', import.meta.url))
const args = process.argv.slice(2)
ensure(
  args.length <= 1 && (args.length === 0 || args[0] === '--check' || args[0] === '--write'),
  'generation arguments',
)
const selection: Selection = JSON.parse(
  readFileSync(resolve(root, 'scripts/battle/selection.json'), 'utf8'),
)
const roster = buildRoster(selection, loadSources(root), loadCatalog(root, selection))
const contents = JSON.stringify(roster, null, 2) + '\n'
const destination = resolve(root, 'src/battle/data/starter-roster.json')
if (args[0] === '--write') writeFileSync(destination, contents)
else
  ensure(
    readFileSync(destination, 'utf8').replaceAll('\r\n', '\n') === contents,
    'snapshot differs; review sources and regenerate explicitly',
  )
console.log(
  roster.version +
    ': ' +
    roster.species.length +
    ' species, ' +
    roster.cards.length +
    ' cards; ' +
    (args[0] === '--write' ? 'written' : 'verified'),
)

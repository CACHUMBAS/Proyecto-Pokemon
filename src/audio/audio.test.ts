import { cryPath, frameCue } from './cues.ts'
import { createPractice } from '../battle/practice.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { DEFAULT_AUDIO, parseAudioSettings, TRACKS } from './settings.ts'
test('audio preferences reject corrupt, unknown, unsafe and partial values without losing safe defaults', () => {
  for (const input of [
    null,
    'broken',
    'null',
    '[]',
    '{"musicVolume":-1,"effectsVolume":200,"track":"http://evil"}',
    '{"musicVolume":1e99}',
  ])
    assert.deepEqual(parseAudioSettings(input), DEFAULT_AUDIO)
  assert.deepEqual(parseAudioSettings('{"musicVolume":0,"effectsVolume":100,"track":"dpp"}'), {
    musicVolume: 0,
    effectsVolume: 100,
    track: 'dpp',
  })
  assert.equal(TRACKS.length, 4)
})
test('every enabled species has a verified local cry and the extension matches its actual format', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../../public/assets/audio/cries/_sources.json', import.meta.url), 'utf8'),
  )
  const roster = JSON.parse(
    readFileSync(new URL('../battle/data/starter-roster.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(
    manifest.files
      .map((f: { speciesId: number }) => f.speciesId)
      .sort((a: number, b: number) => a - b),
    roster.species
      .map((s: { speciesId: number }) => s.speciesId)
      .sort((a: number, b: number) => a - b),
  )
  for (const file of manifest.files) {
    assert.equal(cryPath(file.speciesId), file.path)
    const b = readFileSync(new URL('../../public' + file.path, import.meta.url))
    assert.equal(createHash('sha256').update(b).digest('hex'), file.sha256)
    assert.equal(b.length, file.bytes)
    if (file.path.endsWith('.ogg')) assert.equal(b.subarray(0, 4).toString(), 'OggS')
    else {
      assert.ok(file.path.endsWith('.mp3'))
      assert.equal(b[0], 255)
      assert.equal(b[1] & 224, 224)
    }
  }
})

test('immune and blocked events never trigger a hit or attack sound', () => {
  const battle = createPractice('sound').battle,
    base = { battle, duration: 1 }
  assert.equal(
    frameCue({
      ...base,
      event: { kind: 'blocked', side: 0, actorId: battle.sides[0].fighters[0].id, reason: 'sleep' },
    }),
    null,
  )
  assert.equal(
    frameCue({
      ...base,
      event: {
        kind: 'damage',
        side: 1,
        targetId: battle.sides[1].fighters[0].id,
        source: 'move',
        amount: 0,
        remainingHp: 10,
      },
    })?.kind,
    'immune',
  )
})

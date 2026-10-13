import test from 'node:test'
import assert from 'node:assert/strict'
import { BattleAudio } from './controller.ts'
import type { MediaPort, SoundCue } from './controller.ts'
import { DEFAULT_AUDIO } from './settings.ts'
function rig(reject = false) {
  const media: (MediaPort & { paused: boolean; plays: number })[] = []
  const cues: SoundCue[] = []
  const issues: string[] = []
  let stopped = 0,
    closed = 0
  const engine = new BattleAudio(
    { ...DEFAULT_AUDIO },
    {
      media: (url) => {
        const m = {
          src: url,
          volume: 1,
          loop: false,
          preload: '',
          onerror: null as MediaPort['onerror'],
          paused: true,
          plays: 0,
          play() {
            this.plays++
            this.paused = false
            return reject ? Promise.reject(Error('blocked')) : Promise.resolve()
          },
          pause() {
            this.paused = true
          },
          removeAttribute() {
            this.src = ''
          },
          load() {},
        }
        media.push(m)
        return m
      },
      effects: {
        async resume() {},
        play(cue) {
          cues.push(cue)
        },
        stop() {
          stopped++
        },
        suspend() {},
        close() {
          closed++
        },
      },
      onIssue: (issue) => issues.push(issue),
    },
  )
  return {
    engine,
    media,
    cues,
    issues,
    get stopped() {
      return stopped
    },
    get closed() {
      return closed
    },
  }
}
test('nothing loads or sounds until gesture; mute stops music and effects', async () => {
  const r = rig()
  r.engine.setScene('battle')
  r.engine.cue({ kind: 'attack' })
  assert.equal(r.media.length, 0)
  assert.equal(r.cues.length, 0)
  await r.engine.enable()
  assert.equal(r.media[0].paused, false)
  r.engine.cue({ kind: 'attack', type: 'water' })
  assert.equal(r.cues.length, 1)
  r.engine.disable()
  assert.equal(r.media[0].paused, true)
  assert.ok(r.stopped > 0)
  r.engine.cue({ kind: 'hit' })
  assert.equal(r.cues.length, 1)
})
test('separate volume, track switch, hidden tab, result and dispose release audio', async () => {
  const r = rig()
  await r.engine.enable()
  const first = r.media[0]
  r.engine.configure({ ...DEFAULT_AUDIO, musicVolume: 0, effectsVolume: 0 })
  assert.equal(first.paused, true)
  r.engine.cue({ kind: 'hit' })
  assert.equal(r.cues.length, 0)
  r.engine.configure({ ...DEFAULT_AUDIO, track: 'dpp' })
  assert.equal(first.src, '')
  const next = r.media.at(-1)!
  assert.match(next.src, /dpp-trainer/)
  assert.equal(next.volume, 0.25)
  r.engine.setHidden(true)
  assert.equal(next.paused, true)
  r.engine.setHidden(false)
  await Promise.resolve()
  assert.equal(next.paused, false)
  r.engine.setScene('finished')
  assert.equal(next.paused, true)
  r.engine.dispose()
  assert.equal(next.src, '')
  assert.equal(r.closed, 1)
  r.engine.setScene('battle')
  await r.engine.enable()
  assert.equal(next.paused, true)
})
test('rejected autoplay is contained and reports issue without throwing', async () => {
  const r = rig(true)
  await r.engine.enable()
  assert.ok(r.issues.includes('music'))
  r.engine.dispose()
})
test('a cry is cancelled by a new cry and a pending play cannot survive mute', async () => {
  const r = rig()
  await r.engine.enable()
  r.engine.cue({ kind: 'switch', cryPath: '/assets/audio/cries/25.mp3' })
  const cry = r.media.at(-1)!
  assert.match(cry.src, /25.mp3/)
  r.engine.cue({ kind: 'switch', cryPath: '/assets/audio/cries/1.ogg' })
  assert.equal(cry.src, '')
  r.engine.disable()
  await Promise.resolve()
  assert.equal(
    r.media.every((m) => m.paused),
    true,
  )
})

test('a switch cry survives subsequent frame effects until explicit cancellation', async () => {
  const r = rig()
  await r.engine.enable()
  r.engine.cue({ kind: 'switch', cryPath: '/assets/audio/cries/25.mp3' })
  const cry = r.media.at(-1)!
  r.engine.stopTransient()
  r.engine.cue({ kind: 'attack', type: 'electric' })
  await Promise.resolve()
  assert.equal(cry.src, '/assets/audio/cries/25.mp3')
  assert.equal(cry.paused, false)
  r.engine.disable()
  assert.equal(cry.src, '')
  assert.equal(cry.paused, true)
})

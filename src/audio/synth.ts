import type { EffectsPort, SoundCue } from './controller'
const pitches: Record<string, number> = {
  fire: 180,
  water: 420,
  grass: 320,
  electric: 900,
  psychic: 640,
  ghost: 150,
  fighting: 110,
  rock: 80,
  ice: 1100,
  poison: 250,
  fairy: 780,
  normal: 220,
}
export class BattleSynth implements EffectsPort {
  private context: AudioContext | null = null
  private voices = new Map<OscillatorNode, GainNode>()
  async resume() {
    this.context ??= new AudioContext()
    if (this.context.state === 'suspended') await this.context.resume()
  }
  private tone(
    frequency: number,
    end: number,
    time: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) {
    const context = this.context
    if (!context || context.state !== 'running') return
    const oscillator = context.createOscillator(),
      gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, time)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + duration)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.12), time + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    oscillator.connect(gain)
    gain.connect(context.destination)
    this.voices.set(oscillator, gain)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
      this.voices.delete(oscillator)
    }
    oscillator.start(time)
    oscillator.stop(time + duration + 0.02)
  }
  play(cue: SoundCue, volume: number) {
    const context = this.context
    if (!context || context.state !== 'running') return
    const now = context.currentTime
    if (cue.cryPath) return // Let the real cry remain distinct from synthesized effects.
    if (cue.kind === 'win' || cue.kind === 'lose') {
      const notes = cue.kind === 'win' ? [523, 659, 784] : [392, 330, 262]
      notes.forEach((f, i) => this.tone(f, f, now + i * 0.09, 0.15, volume, 'triangle'))
      return
    }
    const pitch = pitches[cue.type ?? 'normal'] ?? 220
    const config: Record<
      Exclude<SoundCue['kind'], 'win' | 'lose'>,
      [number, number, number, OscillatorType]
    > = {
      attack: [pitch, pitch * 1.8, 0.25, cue.type === 'electric' ? 'sawtooth' : 'triangle'],
      hit: [120, 35, 0.14, 'triangle'],
      immune: [700, 350, 0.12, 'sine'],
      status: [450, 850, 0.22, 'sine'],
      switch: [400, 900, 0.2, 'sine'],
      faint: [240, 45, 0.28, 'triangle'],
    }
    const [start, end, duration, wave] = config[cue.kind]
    this.tone(start, end, now, duration, volume, wave)
  }
  stop() {
    for (const [oscillator, gain] of this.voices) {
      oscillator.onended = null
      oscillator.stop()
      oscillator.disconnect()
      gain.disconnect()
    }
    this.voices.clear()
  }
  suspend() {
    this.stop()
    if (this.context?.state === 'running') void this.context.suspend().catch(() => {})
  }
  close() {
    this.stop()
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {})
    this.context = null
  }
}

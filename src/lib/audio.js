// High-quality synthesizer sound effect for cash bell / confirmation chime using Web Audio API
class SoundEffects {
  constructor() {
    this.ctx = null
    this.muted = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('neota_sound_muted') === 'true'
      : false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  isMuted() {
    return this.muted
  }

  toggleMute() {
    this.muted = !this.muted
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('neota_sound_muted', String(this.muted))
    }
    return this.muted
  }

  // Play pleasant, sparkling cash register / shagun chime
  playCashChime() {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return

      const now = this.ctx.currentTime

      // Primary chime tone (C6 - ~1046 Hz)
      const osc1 = this.ctx.createOscillator()
      const gain1 = this.ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(1046.5, now)
      osc1.frequency.exponentialRampToValueAtTime(2093, now + 0.12)

      gain1.gain.setValueAtTime(0.35, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc1.connect(gain1)
      gain1.connect(this.ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.6)

      // Sparkle harmony tone (G6 - ~1567 Hz)
      const osc2 = this.ctx.createOscillator()
      const gain2 = this.ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1567.98, now + 0.08)

      gain2.gain.setValueAtTime(0.25, now + 0.08)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      osc2.connect(gain2)
      gain2.connect(this.ctx.destination)

      osc2.start(now + 0.08)
      osc2.stop(now + 0.8)

      // Subtle coin coin ring (E7 - ~2637 Hz)
      const osc3 = this.ctx.createOscillator()
      const gain3 = this.ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(2637.02, now + 0.14)

      gain3.gain.setValueAtTime(0.2, now + 0.14)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9)

      osc3.connect(gain3)
      gain3.connect(this.ctx.destination)

      osc3.start(now + 0.14)
      osc3.stop(now + 0.9)
    } catch (e) {
      console.warn('Audio chime skipped:', e)
    }
  }
}

export const sound = new SoundEffects()

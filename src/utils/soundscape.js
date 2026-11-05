export class Soundscape {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.chimeTimer = null;
  }

  ensureContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleAmbience() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureContext();
      this.playChime([587.33, 783.99, 1046.5], 0.06);
      this.chimeTimer = window.setInterval(() => {
        if (!this.enabled) return;
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
        const f1 = notes[Math.floor(Math.random() * notes.length)];
        const f2 = notes[Math.floor(Math.random() * notes.length)];
        this.playChime([f1, f2], 0.035);
      }, 4200);
    } else if (this.chimeTimer) {
      clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }
    return this.enabled;
  }

  playChime(freqs = [659.25, 880], gainPeak = 0.05) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + idx * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 1.2);
    });
  }

  // Resonant carved hardwood temple Wooden Fish ("Cốc!") synthesizer
  playMoktakKnock(isMilestone = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = (isMilestone ? 440 : 396) + (Math.random() * 14 - 7);

    // 1. Hollow hardwood cavity fundamental
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(baseFreq * 1.14, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.022);
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.linearRampToValueAtTime(0.18, now + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
    bodyOsc.connect(bodyGain).connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.22);

    // 2. Carved slit woody overtone
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(baseFreq * 2.04, now);
    woodOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.92, now + 0.035);
    woodGain.gain.setValueAtTime(0.0001, now);
    woodGain.gain.linearRampToValueAtTime(0.085, now + 0.002);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    woodOsc.connect(woodGain).connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.085);

    // 3. Crisp wooden mallet tap transient
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(1280, now);
    tapOsc.frequency.exponentialRampToValueAtTime(520, now + 0.014);
    tapGain.gain.setValueAtTime(0.09, now);
    tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
    tapOsc.connect(tapGain).connect(ctx.destination);
    tapOsc.start(now);
    tapOsc.stop(now + 0.02);
  }

  // Full ritual audio: 1. Bamboo cylinder shaking ("Lắc Quẻ") -> 2. Stick dropping & bouncing ("Rớt Quẻ") -> 3. Reveal chime
  playOracleShake(fullSequence = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const rattleOffsets = fullSequence
      ? [0, 0.09, 0.18, 0.27, 0.36, 0.46, 0.56, 0.67, 0.78, 0.89]
      : [0, 0.08, 0.16, 0.25];

    rattleOffsets.forEach((offset, idx) => {
      const t = now + offset;
      const base = 620 + (idx % 4) * 95 + Math.random() * 40;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(base * 1.3, t);
      osc.frequency.exponentialRampToValueAtTime(base * 0.75, t + 0.036);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.085, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    });

    if (fullSequence) {
      // Stick drop clack + bounce tap on the mat ("Rớt Quẻ")
      [
        { t: now + 1.42, freq: 980, peak: 0.11 },
        { t: now + 1.6, freq: 1120, peak: 0.065 },
      ].forEach(({ t, freq, peak }) => {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        dropOsc.type = 'triangle';
        dropOsc.frequency.setValueAtTime(freq, t);
        dropOsc.frequency.exponentialRampToValueAtTime(420, t + 0.028);
        dropGain.gain.setValueAtTime(0.0001, t);
        dropGain.gain.linearRampToValueAtTime(peak, t + 0.003);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        dropOsc.connect(dropGain).connect(ctx.destination);
        dropOsc.start(t);
        dropOsc.stop(t + 0.045);
      });
    }

    // Final mystic reveal chime
    const revealTime = now + (fullSequence ? 1.78 : 0.36);
    [587.33, 880.0, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, revealTime + i * 0.055);
      gain.gain.setValueAtTime(0.0001, revealTime + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.055, revealTime + i * 0.055 + 0.022);
      gain.gain.exponentialRampToValueAtTime(0.0001, revealTime + i * 0.055 + 0.65);
      osc.connect(gain).connect(ctx.destination);
      osc.start(revealTime + i * 0.055);
      osc.stop(revealTime + i * 0.055 + 0.7);
    });
  }
}

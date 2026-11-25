/**
 * Procedural Web Audio API Sound & Adaptive Music Engine.
 * Zero external MP3/WAV dependencies — generates lush pads, reverb,
 * crystalline harp sequences, waterfall ambience, and 22+ tactile SFX.
 */

const BIOME_CONFIG = {
  title: {
    tempoMs: 680,
    chords: [
      [146.83, 220.0, 261.63, 329.63], // Dm9
      [174.61, 220.0, 261.63, 392.0], // Fmaj9
      [130.81, 196.0, 246.94, 293.66], // Cmaj9
      [196.0, 246.94, 293.66, 349.23], // G7sus
    ],
    scale: [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25],
    harpProb: 0.62,
    padCutoff: 650,
    windGain: 0.035,
    bassPulse: false,
  },
  forest: {
    tempoMs: 560,
    chords: [
      [146.83, 220.0, 293.66, 349.23],
      [174.61, 261.63, 329.63, 440.0],
      [130.81, 196.0, 261.63, 329.63],
      [164.81, 246.94, 329.63, 392.0],
    ],
    scale: [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99],
    harpProb: 0.72,
    padCutoff: 780,
    windGain: 0.045,
    bassPulse: false,
  },
  canopy: {
    tempoMs: 490,
    chords: [
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 392.0],
      [146.83, 220.0, 277.18, 329.63],
      [164.81, 246.94, 329.63, 440.0],
    ],
    scale: [349.23, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0],
    harpProb: 0.76,
    padCutoff: 960,
    windGain: 0.06,
    bassPulse: false,
  },
  cavern: {
    tempoMs: 620,
    chords: [
      [130.81, 196.0, 246.94, 311.13], // Cm(maj9) mystical
      [116.54, 174.61, 220.0, 293.66], // Bbmaj7
      [146.83, 220.0, 261.63, 349.23],
      [130.81, 196.0, 233.08, 293.66],
    ],
    scale: [261.63, 311.13, 392.0, 440.0, 523.25, 587.33, 698.46],
    harpProb: 0.68,
    padCutoff: 540,
    windGain: 0.055,
    bassPulse: false,
  },
  abyss: {
    tempoMs: 540,
    chords: [
      [123.47, 185.0, 220.0, 293.66], // Bm9 ethereal
      [110.0, 164.81, 196.0, 261.63], // Am9
      [130.81, 196.0, 246.94, 329.63], // Cmaj9
      [116.54, 174.61, 207.65, 293.66],
    ],
    scale: [246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25],
    harpProb: 0.74,
    padCutoff: 640,
    windGain: 0.05,
    bassPulse: false,
  },
  sanctuary: {
    tempoMs: 500,
    chords: [
      [146.83, 220.0, 261.63, 329.63],
      [116.54, 174.61, 233.08, 293.66],
      [130.81, 196.0, 261.63, 329.63],
      [164.81, 220.0, 293.66, 392.0],
    ],
    scale: [293.66, 349.23, 440.0, 523.25, 587.33, 659.25, 880.0],
    harpProb: 0.78,
    padCutoff: 880,
    windGain: 0.04,
    bassPulse: false,
  },
  boss: {
    tempoMs: 260,
    chords: [
      [110.0, 164.81, 220.0, 261.63], // Am driving
      [98.0, 146.83, 196.0, 246.94], // G
      [87.31, 130.81, 174.61, 220.0], // F
      [82.41, 123.47, 164.81, 207.65], // E tension
    ],
    scale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25],
    harpProb: 0.85,
    padCutoff: 1150,
    windGain: 0.025,
    bassPulse: true,
  },
  victory: {
    tempoMs: 420,
    chords: [
      [146.83, 220.0, 277.18, 329.63], // Dmaj9
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [164.81, 246.94, 293.66, 369.99],
      [220.0, 277.18, 329.63, 440.0],
    ],
    scale: [293.66, 369.99, 440.0, 554.37, 587.33, 739.99, 880.0],
    harpProb: 0.9,
    padCutoff: 1300,
    windGain: 0.02,
    bassPulse: false,
  },
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.reverbSend = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.bgmVolume = 0.42;
    this.sfxVolume = 0.9;
    this.unlocked = false;
    this.biome = 'title';
    this.stepIndex = 0;
    this.chordIndex = 0;
    this.sequencerTimer = null;

    this.padOscs = [];
    this.padFilter = null;
    this.padGain = null;
    this.windGain = null;
    this.waterfallGain = null;
    this.waterfallTarget = 0;
  }

  unlock() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.setupGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    this.startMusicLoop();
  }

  setupGraph() {
    const ctx = this.ctx;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.18;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.85;
    this.masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = this.bgmVolume;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Algorithmic stereo reverb via ConvolverNode
    const convolver = ctx.createConvolver();
    convolver.buffer = this.createReverbImpulse(1.7, 2.8);
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.34;
    convolver.connect(reverbWet);
    reverbWet.connect(this.masterGain);
    this.reverbSend = convolver;

    this.noiseBuffer = this.createNoiseBuffer(2.0);
    this.setupAmbienceAndPad();
  }

  createNoiseBuffer(durationSec) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * durationSec);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.12) * 0.5;
    }
    return buf;
  }

  createReverbImpulse(durationSec, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * durationSec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        const white = (Math.random() * 2 - 1) * env;
        lp = lp * 0.55 + white * 0.45;
        data[i] = lp;
      }
    }
    return buf;
  }

  setupAmbienceAndPad() {
    const ctx = this.ctx;
    // Continuous warm chord pad
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 720;
    this.padFilter.Q.value = 1.2;

    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.16;
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.bgmGain);
    this.padGain.connect(this.reverbSend);

    const cfg = BIOME_CONFIG[this.biome] || BIOME_CONFIG.title;
    const chord = cfg.chords[0];
    this.padOscs = chord.map((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (idx - 1.5) * 6;
      const g = ctx.createGain();
      g.gain.value = idx === 0 ? 0.35 : 0.22;
      osc.connect(g);
      g.connect(this.padFilter);
      osc.start();
      return osc;
    });

    // Gentle forest wind loop
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 1.4;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = cfg.windGain;
    windSrc.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.bgmGain);
    windSrc.start();

    // Spatial waterfall rushing sound scaled by proximity
    const wfSrc = ctx.createBufferSource();
    wfSrc.buffer = this.noiseBuffer;
    wfSrc.loop = true;
    const wfFilter = ctx.createBiquadFilter();
    wfFilter.type = 'bandpass';
    wfFilter.frequency.value = 820;
    wfFilter.Q.value = 0.65;
    this.waterfallGain = ctx.createGain();
    this.waterfallGain.gain.value = 0.0001;
    wfSrc.connect(wfFilter);
    wfFilter.connect(this.waterfallGain);
    this.waterfallGain.connect(this.sfxGain);
    this.waterfallGain.connect(this.reverbSend);
    wfSrc.start();
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.04);
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  setBgmVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.04);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.04);
    }
  }

  setBiome(biome) {
    if (!BIOME_CONFIG[biome]) return;
    if (this.biome === biome) return;
    this.biome = biome;
    this.chordIndex = 0;
    this.stepIndex = 0;

    if (this.ctx && this.padFilter && this.windGain) {
      const cfg = BIOME_CONFIG[biome];
      const now = this.ctx.currentTime;
      this.padFilter.frequency.setTargetAtTime(cfg.padCutoff, now, 0.7);
      this.windGain.gain.setTargetAtTime(cfg.windGain, now, 0.6);
      this.updatePadChord(cfg.chords[0]);
    }
    if (this.sequencerTimer) {
      clearInterval(this.sequencerTimer);
      this.sequencerTimer = null;
      this.startMusicLoop();
    }
  }

  updatePadChord(chord) {
    if (!this.ctx || !this.padOscs.length) return;
    const now = this.ctx.currentTime;
    this.padOscs.forEach((osc, i) => {
      const targetFreq = chord[i % chord.length];
      osc.frequency.setTargetAtTime(targetFreq, now, 0.45);
    });
  }

  startMusicLoop() {
    if (!this.ctx || this.sequencerTimer) return;
    const cfg = BIOME_CONFIG[this.biome] || BIOME_CONFIG.title;
    this.sequencerTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const activeCfg = BIOME_CONFIG[this.biome] || BIOME_CONFIG.title;
      const now = this.ctx.currentTime;

      if (this.stepIndex % 8 === 0) {
        this.chordIndex = (this.chordIndex + 1) % activeCfg.chords.length;
        this.updatePadChord(activeCfg.chords[this.chordIndex]);
      }

      // Crystalline harp / kalimba pluck
      if (Math.random() < activeCfg.harpProb) {
        const note = activeCfg.scale[Math.floor(Math.random() * activeCfg.scale.length)];
        const octave = Math.random() < 0.25 ? 2 : 1;
        this.playHarpNote(note * octave, now, activeCfg.bassPulse ? 0.1 : 0.075);
      }

      // Rhythmic boss bass pulse
      if (activeCfg.bassPulse && this.stepIndex % 2 === 0) {
        const root = activeCfg.chords[this.chordIndex][0] * 0.5;
        this.playBassPulse(root, now);
      }

      this.stepIndex += 1;
    }, cfg.tempoMs);
  }

  playHarpNote(freq, startTime, gainVal = 0.08) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    osc.type = 'sine';
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    sub.frequency.setValueAtTime(freq * 2, startTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(gainVal, startTime + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.15);

    const subGain = ctx.createGain();
    subGain.gain.value = 0.18;

    osc.connect(g);
    sub.connect(subGain);
    subGain.connect(g);
    g.connect(this.bgmGain);
    g.connect(this.reverbSend);

    osc.start(startTime);
    sub.start(startTime);
    osc.stop(startTime + 1.2);
    sub.stop(startTime + 1.2);
  }

  playBassPulse(freq, startTime) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, startTime);
    filter.frequency.exponentialRampToValueAtTime(95, startTime + 0.2);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(0.16, startTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.bgmGain);
    osc.start(startTime);
    osc.stop(startTime + 0.24);
  }

  setWaterfallProximity(amount) {
    if (!this.ctx || !this.waterfallGain) return;
    const clamped = Math.max(0, Math.min(1, amount));
    const target = 0.0001 + clamped * clamped * 0.22;
    this.waterfallGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }

  vibrate(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  ready() {
    if (!this.ctx || this.muted) return false;
    if (this.unlocked && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx.state === 'running';
  }

  tone(freq, endFreq, dur, { type = 'sine', gain = 0.16, reverb = 0.2, delay = 0 } = {}) {
    if (!this.ready()) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    }

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(this.sfxGain);
    if (reverb > 0) {
      const rv = ctx.createGain();
      rv.gain.value = reverb;
      g.connect(rv);
      rv.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  noiseBurst(dur, { filterFreq = 900, filterType = 'bandpass', q = 1.2, gain = 0.15, delay = 0 } = {}) {
    if (!this.ready() || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.Q.value = q;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // =========================================================================
  // 22+ Synthesized Sound Effects
  // =========================================================================

  playUiClick() {
    this.tone(587.33, 880, 0.08, { type: 'sine', gain: 0.12, reverb: 0.35 });
  }

  playFootstep(surface = 'moss') {
    const jitter = 0.9 + Math.random() * 0.2;
    if (surface === 'crystal') {
      this.tone(1100 * jitter, 760 * jitter, 0.06, { type: 'sine', gain: 0.055, reverb: 0.45 });
    } else if (surface === 'bridge') {
      this.tone(720 * jitter, 980 * jitter, 0.07, { type: 'triangle', gain: 0.05, reverb: 0.5 });
    } else if (surface === 'stone' || surface === 'sanctuary') {
      this.noiseBurst(0.045, { filterFreq: 420 * jitter, gain: 0.075 });
      this.tone(145 * jitter, 75, 0.05, { type: 'triangle', gain: 0.06, reverb: 0.15 });
    } else {
      this.noiseBurst(0.05, { filterFreq: 680 * jitter, gain: 0.065 });
    }
  }

  playJump() {
    const j = 0.96 + Math.random() * 0.08;
    this.tone(240 * j, 520 * j, 0.16, { type: 'sine', gain: 0.16, reverb: 0.25 });
    this.noiseBurst(0.09, { filterFreq: 1200, gain: 0.05 });
    this.vibrate(10);
  }

  playDoubleJump() {
    this.tone(440, 740, 0.14, { type: 'triangle', gain: 0.14, reverb: 0.4 });
    this.tone(659.25, 987.77, 0.16, { type: 'sine', gain: 0.12, reverb: 0.5, delay: 0.03 });
    this.vibrate(12);
  }

  playLand(intensity = 1) {
    const vol = Math.min(0.18, 0.06 + intensity * 0.08);
    this.tone(135, 58, 0.09, { type: 'triangle', gain: vol, reverb: 0.15 });
    this.noiseBurst(0.06, { filterFreq: 480, gain: vol * 0.7 });
  }

  playSolarCast() {
    const j = 0.95 + Math.random() * 0.1;
    this.noiseBurst(0.18, { filterFreq: 1500, filterType: 'bandpass', gain: 0.16 });
    this.tone(330 * j, 660 * j, 0.16, { type: 'sawtooth', gain: 0.11, reverb: 0.3 });
    this.tone(495 * j, 880 * j, 0.2, { type: 'triangle', gain: 0.12, reverb: 0.35, delay: 0.02 });
    this.vibrate(20);
  }

  playLunarCast() {
    const j = 0.96 + Math.random() * 0.08;
    this.tone(783.99 * j, 1174.66 * j, 0.24, { type: 'sine', gain: 0.14, reverb: 0.65 });
    this.tone(1174.66 * j, 1567.98 * j, 0.28, { type: 'triangle', gain: 0.09, reverb: 0.7, delay: 0.03 });
    this.noiseBurst(0.16, { filterFreq: 2400, gain: 0.07 });
    this.vibrate(20);
  }

  playBriarBurn() {
    this.noiseBurst(0.45, { filterFreq: 1100, gain: 0.2 });
    this.tone(220, 440, 0.35, { type: 'sawtooth', gain: 0.1, reverb: 0.4 });
    this.tone(587.33, 880, 0.3, { type: 'sine', gain: 0.12, reverb: 0.55, delay: 0.08 });
    this.vibrate([18, 25, 22]);
  }

  playTotemLit(kind = 'solar') {
    if (kind === 'solar') {
      [293.66, 440, 587.33, 739.99].forEach((f, i) => {
        this.tone(f, f * 1.01, 0.45, { type: 'triangle', gain: 0.13, reverb: 0.55, delay: i * 0.06 });
      });
    } else {
      [392.0, 523.25, 659.25, 987.77].forEach((f, i) => {
        this.tone(f, f * 1.01, 0.55, { type: 'sine', gain: 0.13, reverb: 0.75, delay: i * 0.065 });
      });
    }
    this.vibrate([16, 20, 26]);
  }

  playGateOpen() {
    this.noiseBurst(0.65, { filterFreq: 190, filterType: 'lowpass', gain: 0.24 });
    this.tone(110, 82, 0.65, { type: 'triangle', gain: 0.2, reverb: 0.4 });
    [293.66, 440, 554.37, 659.25, 880].forEach((f, i) => {
      this.tone(f, f, 0.75, { type: 'sine', gain: 0.12, reverb: 0.8, delay: 0.14 + i * 0.08 });
    });
    this.vibrate([25, 35, 50]);
  }

  playShardCollect(combo = 0) {
    const notes = [587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
    const base = notes[combo % notes.length];
    this.tone(base, base * 1.02, 0.24, { type: 'sine', gain: 0.15, reverb: 0.65 });
    this.tone(base * 1.5, base * 1.52, 0.28, { type: 'triangle', gain: 0.08, reverb: 0.75, delay: 0.05 });
    this.vibrate(12);
  }

  playBounceMushroom() {
    this.tone(165, 510, 0.24, { type: 'sine', gain: 0.22, reverb: 0.35 });
    this.tone(330, 680, 0.2, { type: 'triangle', gain: 0.1, reverb: 0.45, delay: 0.03 });
    this.vibrate(18);
  }

  playPartnerBoost() {
    [440, 587.33, 880].forEach((f, i) => {
      this.tone(f, f * 1.12, 0.22, { type: 'sine', gain: 0.14, reverb: 0.55, delay: i * 0.04 });
    });
    this.vibrate([12, 16, 18]);
  }

  playHarmonyPulse() {
    [293.66, 440, 587.33, 659.25, 880].forEach((f, i) => {
      this.tone(f, f * 1.005, 0.85, { type: 'sine', gain: 0.13, reverb: 0.85, delay: i * 0.03 });
    });
    this.vibrate([20, 30, 35]);
  }

  playEmotePing() {
    this.tone(698.46, 987.77, 0.12, { type: 'sine', gain: 0.13, reverb: 0.6 });
    this.tone(987.77, 1318.51, 0.16, { type: 'sine', gain: 0.12, reverb: 0.7, delay: 0.09 });
  }

  playCheckpoint() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(f, f, 0.45, { type: 'sine', gain: 0.12, reverb: 0.75, delay: i * 0.07 });
    });
    this.vibrate(20);
  }

  playEnemyHit() {
    this.tone(240, 120, 0.12, { type: 'sawtooth', gain: 0.13, reverb: 0.2 });
    this.noiseBurst(0.08, { filterFreq: 1300, gain: 0.12 });
  }

  playEnemyDefeat() {
    this.tone(392, 140, 0.28, { type: 'triangle', gain: 0.16, reverb: 0.45 });
    this.tone(783.99, 1174.66, 0.26, { type: 'sine', gain: 0.12, reverb: 0.65, delay: 0.05 });
    this.vibrate(24);
  }

  playPlayerHurt() {
    this.tone(210, 92, 0.24, { type: 'sawtooth', gain: 0.18, reverb: 0.25 });
    this.noiseBurst(0.14, { filterFreq: 650, gain: 0.16 });
    this.vibrate([35, 30, 35]);
  }

  playRevive() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => {
      this.tone(f, f * 1.03, 0.45, { type: 'sine', gain: 0.14, reverb: 0.75, delay: i * 0.06 });
    });
  }

  playBossRoar() {
    this.tone(130, 52, 0.75, { type: 'sawtooth', gain: 0.22, reverb: 0.6 });
    this.noiseBurst(0.6, { filterFreq: 320, filterType: 'lowpass', gain: 0.24 });
    this.vibrate([40, 40, 60]);
  }

  playBossAttack() {
    this.tone(420, 180, 0.22, { type: 'triangle', gain: 0.13, reverb: 0.4 });
  }

  playBossShieldBreak() {
    this.noiseBurst(0.35, { filterFreq: 2600, gain: 0.22 });
    [880, 1174.66, 1479.98, 1760].forEach((f, i) => {
      this.tone(f, f * 0.85, 0.38, { type: 'sine', gain: 0.14, reverb: 0.8, delay: i * 0.03 });
    });
    this.vibrate([30, 30, 60]);
  }

  playBossDefeat() {
    this.noiseBurst(0.9, { filterFreq: 480, filterType: 'lowpass', gain: 0.26 });
    [293.66, 369.99, 440, 587.33, 739.99, 880].forEach((f, i) => {
      this.tone(f, f, 1.1, { type: 'sine', gain: 0.14, reverb: 0.85, delay: 0.15 + i * 0.09 });
    });
    this.vibrate([40, 50, 40, 50, 90]);
  }

  playVictoryFanfare() {
    [293.66, 440, 554.37, 587.33, 739.99, 880, 1174.66].forEach((f, i) => {
      this.tone(f, f, 0.9, { type: 'triangle', gain: 0.13, reverb: 0.85, delay: i * 0.1 });
    });
  }

  playHintChime() {
    this.tone(783.99, 987.77, 0.16, { type: 'sine', gain: 0.11, reverb: 0.65 });
    this.tone(1174.66, 1318.51, 0.22, { type: 'sine', gain: 0.1, reverb: 0.75, delay: 0.08 });
  }

  playTutorialStepComplete() {
    [523.25, 659.25, 987.77].forEach((f, i) => {
      this.tone(f, f * 1.02, 0.28, { type: 'sine', gain: 0.13, reverb: 0.7, delay: i * 0.07 });
    });
    this.vibrate([12, 16, 20]);
  }

  playStageStart() {
    [293.66, 440, 587.33, 880].forEach((f, i) => {
      this.tone(f, f * 1.01, 0.55, { type: 'triangle', gain: 0.1, reverb: 0.8, delay: i * 0.07 });
    });
  }

  playPortalEnter() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      this.tone(f, f * 1.08, 0.45, { type: 'sine', gain: 0.12, reverb: 0.85, delay: i * 0.05 });
    });
    this.vibrate([18, 25, 35]);
  }

  playPortalWait() {
    this.tone(587.33, 659.25, 0.22, { type: 'sine', gain: 0.1, reverb: 0.6 });
  }

  playProjectileImpact(power = 'solar', resisted = false) {
    if (resisted) {
      this.tone(310, 175, 0.1, { type: 'triangle', gain: 0.09, reverb: 0.2 });
      return;
    }
    if (power === 'solar') {
      this.noiseBurst(0.08, { filterFreq: 1650, gain: 0.09 });
      this.tone(280, 140, 0.08, { type: 'triangle', gain: 0.07, reverb: 0.2 });
    } else {
      this.tone(920, 620, 0.11, { type: 'sine', gain: 0.07, reverb: 0.5 });
    }
  }

  playBossShieldDeflect() {
    this.tone(720, 420, 0.16, { type: 'sawtooth', gain: 0.11, reverb: 0.45 });
    this.tone(1120, 880, 0.14, { type: 'sine', gain: 0.1, reverb: 0.5, delay: 0.02 });
    this.vibrate(14);
  }

  playBossWeaknessShift(weakness = 'solar') {
    if (weakness === 'solar') {
      this.tone(392, 659.25, 0.26, { type: 'triangle', gain: 0.12, reverb: 0.55 });
    } else {
      this.tone(659.25, 987.77, 0.28, { type: 'sine', gain: 0.12, reverb: 0.7 });
    }
  }

  playLowHealthWarning() {
    this.tone(155, 110, 0.14, { type: 'sine', gain: 0.15, reverb: 0.2 });
    this.tone(145, 98, 0.18, { type: 'sine', gain: 0.14, reverb: 0.2, delay: 0.16 });
    this.vibrate([25, 45, 25]);
  }

  playSwapCharacter() {
    this.tone(440, 740, 0.15, { type: 'sine', gain: 0.12, reverb: 0.5 });
    this.vibrate(10);
  }

  playMenuToggle(open = true) {
    this.tone(open ? 440 : 660, open ? 660 : 440, 0.1, { type: 'sine', gain: 0.1, reverb: 0.35 });
  }

  playComboSparkle() {
    [1046.5, 1318.51, 1567.98].forEach((f, i) => {
      this.tone(f, f * 1.03, 0.22, { type: 'sine', gain: 0.1, reverb: 0.75, delay: i * 0.04 });
    });
  }
}

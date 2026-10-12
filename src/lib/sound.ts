/**
 * Procedural sound design with the Web Audio API — no audio files to ship.
 * Every effect is synthesized on the fly; the optional ambient music is a
 * slowly evolving generative pad.
 */

type Sfx =
  | 'hover' | 'click' | 'open' | 'close' | 'correct' | 'wrong' | 'select'
  | 'unlock' | 'levelup' | 'achievement' | 'xp' | 'mastered' | 'tick' | 'fail' | 'whoosh';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let enabled = true;
let volume = 0.7;
let lastHover = 0;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.4, 2.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function impulse(c: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  start?: number;
  dur?: number;
  gain?: number;
  attack?: number;
  slideTo?: number;
  wet?: boolean;
  detune?: number;
}

function tone(o: ToneOpts) {
  const c = ensure();
  if (!c || !sfxBus) return;
  const t = c.currentTime + (o.start ?? 0);
  const dur = o.dur ?? 0.15;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.detune) osc.detune.value = o.detune;
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(sfxBus);
  if (o.wet && reverb) g.connect(reverb);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, from: number, to: number, gain = 0.12, q = 2) {
  const c = ensure();
  if (!c || !sfxBus) return;
  const t = c.currentTime + start;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t);
}

const N = (semi: number, base = 440) => base * Math.pow(2, semi / 12);
// A major-ish pentatonic palette relative to A4
const C5 = N(3), E5 = N(7), G5 = N(10), A5 = N(12), C6 = N(15), E6 = N(19), D5 = N(5);

const library: Record<Sfx, () => void> = {
  hover() {
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now;
    tone({ freq: 1800, dur: 0.04, gain: 0.025, type: 'sine' });
  },
  tick() {
    tone({ freq: 1200, dur: 0.03, gain: 0.04, type: 'triangle' });
  },
  click() {
    tone({ freq: 660, slideTo: 990, dur: 0.07, gain: 0.08, type: 'triangle' });
  },
  select() {
    tone({ freq: 520, dur: 0.06, gain: 0.07, type: 'square' });
    tone({ freq: 780, dur: 0.08, gain: 0.04, type: 'sine', start: 0.03 });
  },
  open() {
    noise(0, 0.28, 400, 3200, 0.06);
    tone({ freq: E5, dur: 0.25, gain: 0.05, wet: true, start: 0.05 });
  },
  close() {
    noise(0, 0.22, 2800, 300, 0.05);
  },
  whoosh() {
    noise(0, 0.5, 200, 4000, 0.07, 1.2);
  },
  correct() {
    tone({ freq: E5, dur: 0.14, gain: 0.14, type: 'triangle' });
    tone({ freq: A5, dur: 0.3, gain: 0.14, type: 'triangle', start: 0.08, wet: true });
    tone({ freq: E6, dur: 0.25, gain: 0.04, start: 0.08, wet: true });
  },
  wrong() {
    tone({ freq: 220, slideTo: 140, dur: 0.32, gain: 0.12, type: 'sawtooth' });
    tone({ freq: 233, slideTo: 150, dur: 0.32, gain: 0.08, type: 'square' });
  },
  xp() {
    [0, 0.05, 0.1].forEach((s, i) => tone({ freq: [C6, E6, N(24)][i], dur: 0.1, gain: 0.05, start: s }));
  },
  unlock() {
    noise(0, 0.6, 300, 6000, 0.05, 0.8);
    [C5, E5, G5, C6, E6].forEach((f, i) =>
      tone({ freq: f, dur: 0.45, gain: 0.09, type: 'triangle', start: 0.12 + i * 0.07, wet: true }),
    );
  },
  achievement() {
    [A5, C6, E6, N(24)].forEach((f, i) => {
      tone({ freq: f, dur: 0.6, gain: 0.08, type: 'sine', start: i * 0.09, wet: true });
      tone({ freq: f * 2, dur: 0.3, gain: 0.02, type: 'sine', start: i * 0.09 + 0.01, wet: true });
    });
  },
  levelup() {
    noise(0, 0.8, 200, 8000, 0.05, 0.7);
    const seq = [C5, E5, G5, C6, G5, C6, E6];
    seq.forEach((f, i) => tone({ freq: f, dur: 0.22, gain: 0.1, type: 'square', start: i * 0.08 }));
    [C5, E5, G5, C6].forEach((f) => tone({ freq: f, dur: 1.6, gain: 0.06, type: 'sawtooth', start: 0.6, attack: 0.05, wet: true }));
  },
  mastered() {
    noise(0, 1.1, 150, 9000, 0.06, 0.6);
    const arp = [A5 / 2, C5, E5, A5, C6, E6];
    arp.forEach((f, i) => tone({ freq: f, dur: 0.5, gain: 0.1, type: 'triangle', start: i * 0.06, wet: true }));
    [A5 / 2, E5, A5, C6 * 1.0].forEach((f) =>
      tone({ freq: f, dur: 2.2, gain: 0.05, type: 'sawtooth', start: 0.45, attack: 0.1, wet: true, detune: 6 }),
    );
  },
  fail() {
    [E5, D5, C5 * 0.94].forEach((f, i) => tone({ freq: f, dur: 0.35, gain: 0.08, type: 'triangle', start: i * 0.16, wet: true }));
  },
};

export function play(name: Sfx) {
  if (!enabled) return;
  try {
    library[name]();
  } catch {
    /* audio is best-effort */
  }
}

export function configureSound(opts: { sound: boolean; volume: number }) {
  enabled = opts.sound;
  volume = opts.volume;
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
}

// ---------- generative ambient music ----------

let musicTimer: number | null = null;
let musicOn = false;
const progression = [
  [N(-12), N(-5), N(0), N(3), N(7)], // Am(add9)-ish
  [N(-16), N(-9), N(-4), N(0), N(3)], // F
  [N(-19), N(-12), N(-7), N(-2), N(2)], // D
  [N(-14), N(-7), N(-2), N(2), N(5)], // G
];
let chordIdx = 0;

function playChord() {
  const c = ensure();
  if (!c || !musicBus) return;
  const t = c.currentTime;
  const chord = progression[chordIdx++ % progression.length];
  const dur = 8;
  chord.forEach((f, i) => {
    const osc = c.createOscillator();
    const osc2 = c.createOscillator();
    const filter = c.createBiquadFilter();
    const g = c.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'sine';
    osc.frequency.value = f;
    osc2.frequency.value = f * 2;
    osc.detune.value = (i % 2 ? 1 : -1) * 7;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(900 + i * 120, t + dur / 2);
    filter.frequency.linearRampToValueAtTime(380, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.022, t + 2.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g).connect(musicBus!);
    if (reverb) g.connect(reverb);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur + 2);
    osc2.stop(t + dur + 2);
  });
  // gentle sparkles
  for (let k = 0; k < 4; k++) {
    if (Math.random() < 0.6) {
      const f = chord[Math.floor(Math.random() * chord.length)] * 4;
      const st = 1 + k * 1.8 + Math.random();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + st);
      g.gain.exponentialRampToValueAtTime(0.012, t + st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + st + 1.6);
      o.connect(g).connect(musicBus!);
      if (reverb) g.connect(reverb);
      o.start(t + st);
      o.stop(t + st + 1.8);
    }
  }
}

export function setMusic(on: boolean) {
  if (on === musicOn) return;
  musicOn = on;
  const c = ensure();
  if (!c || !musicBus) return;
  if (on) {
    musicBus.gain.setTargetAtTime(1, c.currentTime, 1.2);
    playChord();
    musicTimer = window.setInterval(playChord, 8000);
  } else {
    musicBus.gain.setTargetAtTime(0, c.currentTime, 0.6);
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
  }
}

/** Browsers require a user gesture before audio can start. */
export function unlockAudio() {
  ensure();
}

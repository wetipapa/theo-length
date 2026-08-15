/**
 * 소리와 진동.
 *
 * 음원 파일을 두지 않고 Web Audio로 그때그때 만든다. 받을 것이 없어 첫 로딩이 빠르고,
 * 조각이 이어질수록 음을 올리는 것처럼 상황에 맞춰 바꾸기도 쉽다.
 *
 * 모바일 브라우저는 사용자가 화면을 한 번 건드리기 전에는 소리를 내주지 않는다.
 * 그래서 첫 터치에서 `unlock()`을 부른다.
 */

let ctx: AudioContext | null = null;
let soundOn = true;
let hapticsOn = true;

export function setSound(on: boolean) {
  soundOn = on;
}

export function setHaptics(on: boolean) {
  hapticsOn = on;
}

export function unlock() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
}

function ready(): AudioContext | null {
  if (!soundOn || !ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType, gain: number, delay = 0) {
  const ac = ready();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration: number, gain: number, filterFreq: number, sweepTo?: number) {
  const ac = ready();
  if (!ac) return;
  const t0 = ac.currentTime;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, t0);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(t0);
}

function buzz(pattern: number | number[]) {
  if (!hapticsOn) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* 진동을 지원하지 않는 기기 — 없어도 게임은 굴러간다 */
  }
}

/**
 * 조각이 딱 붙을 때의 "착".
 * 몇 번째로 붙였는지에 따라 음이 한 칸씩 올라간다 — 쌓이는 느낌이 귀로도 들린다.
 */
export function playSnap(index = 0) {
  const step = Math.min(index, 7);
  noise(0.05, 0.12, 2200, 900);
  tone(420 * Math.pow(2, step / 12), 0.09, "square", 0.09);
  buzz(12);
}

/** 다리가 완성되는 순간 */
export function playComplete() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.14, i * 0.06));
  buzz([16, 24, 16, 24, 30]);
}

/** 수레가 달려 건너는 소리 */
export function playCross() {
  noise(0.7, 0.07, 700, 1800);
}

/** 조각이 틈보다 길어 들어가지 않을 때. 야단치는 소리가 되지 않게 짧고 낮게 */
export function playTooLong() {
  tone(200, 0.14, "sine", 0.09);
  buzz(24);
}

/** 놓은 조각을 도로 빼낼 때 */
export function playUndo() {
  tone(320, 0.07, "sine", 0.06);
  buzz(8);
}

export function playFinish() {
  [784, 659, 523, 659, 784].forEach((f, i) => tone(f, 0.24, "triangle", 0.12, i * 0.12));
  buzz([20, 40, 20, 40, 60]);
}

export function playTap() {
  tone(660, 0.06, "sine", 0.05);
  buzz(10);
}

// Необязательные звуковые эффекты: синтез через WebAudio, без файлов и сети.
// Включаются только в настройках (по умолчанию выключены).
type SoundName = 'click' | 'complete' | 'unlock' | 'achievement' | 'fanfare' | 'whoosh';

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.06) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime + start);
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

export function playSound(name: SoundName) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    switch (name) {
      case 'click':
        tone(660, 0, 0.08, 'triangle', 0.04);
        break;
      case 'complete':
        tone(523, 0, 0.15, 'triangle');
        tone(784, 0.1, 0.25, 'triangle');
        break;
      case 'unlock':
        tone(440, 0, 0.12, 'sine');
        tone(660, 0.08, 0.2, 'sine');
        break;
      case 'achievement':
        [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.05));
        break;
      case 'fanfare':
        [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.5, 'sawtooth', 0.025));
        break;
      case 'whoosh':
        tone(220, 0, 0.5, 'sine', 0.03);
        tone(330, 0.1, 0.5, 'sine', 0.02);
        break;
    }
  } catch {
    /* звук не критичен */
  }
}

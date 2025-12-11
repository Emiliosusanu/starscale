let audioContext = null;
let lastClickTime = 0;

export function playClickSound() {
  if (typeof window === 'undefined') return;

  const now = window.performance && window.performance.now ? window.performance.now() : Date.now();
  if (now - lastClickTime < 75) {
    return;
  }
  lastClickTime = now;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    const ctx = audioContext;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = ctx.currentTime;
    const duration = 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, startTime);
    osc.frequency.exponentialRampToValueAtTime(440, startTime + duration);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Ignore audio errors
  }
}

let audioContext = null;
let lastClickTime = 0;

export function ensureAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) {
      audioContext = new AudioCtx();
      try { window.__starscaleAudioCtx = audioContext; } catch {}
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

export function playClickSound() {
  if (typeof window === 'undefined') return;

  const now = window.performance && window.performance.now ? window.performance.now() : Date.now();
  if (now - lastClickTime < 75) return;
  lastClickTime = now;

  const ctx = ensureAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime;
    const duration = 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, startTime);
    osc.frequency.exponentialRampToValueAtTime(420, startTime + duration);

    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.002, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {}
}

export function playNotificationChime() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  try {
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    const t = ctx.currentTime;
    o1.type = 'sine';
    o1.frequency.setValueAtTime(660, t);
    g1.gain.setValueAtTime(0.09, t);
    g1.gain.exponentialRampToValueAtTime(0.002, t + 0.25);
    o1.connect(g1); g1.connect(ctx.destination);
    o1.start(t); o1.stop(t + 0.25);
  } catch {}
}

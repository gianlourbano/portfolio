// Tiny WebAudio-based beep for retro UI feedback.
// Safe to call even if AudioContext is unavailable.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    try {
        if (!audioCtx) {
            const AC =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        return audioCtx;
    } catch {
        return null;
    }
}

export function beep(options?: {
    freq?: number;
    duration?: number;
    volume?: number;
    type?: OscillatorType;
}) {
    const ctx = getCtx();
    if (!ctx) return;
    const {
        freq = 880,
        duration = 0.06,
        volume = 0.05,
        type = "square",
    } = options || {};
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
}

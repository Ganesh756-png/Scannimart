let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
            audioCtx = new AudioCtxClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

/**
 * Standard scan beep: crisp, short, high-pitched sine wave
 */
export function playScanBeep() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1050, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.warn('Audio playScanBeep blocked or failed:', e);
    }
}

/**
 * Positive success chime: ascending C-E-G major arpeggio
 */
export function playSuccessChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const playNote = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        };

        const now = ctx.currentTime;
        playNote(523.25, now, 0.15);       // C5
        playNote(659.25, now + 0.08, 0.15); // E5
        playNote(783.99, now + 0.16, 0.25); // G5
    } catch (e) {
        console.warn('Audio playSuccessChime blocked or failed:', e);
    }
}

/**
 * Discrepancy warning buzzer: harsh double sawtooth beep
 */
export function playDiscrepancyBuzzer() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const playBuzz = (start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.linearRampToValueAtTime(0.001, start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        };

        const now = ctx.currentTime;
        playBuzz(now, 0.22);
        playBuzz(now + 0.28, 0.22);
    } catch (e) {
        console.warn('Audio playDiscrepancyBuzzer blocked or failed:', e);
    }
}

/**
 * Successful payment retro coin chime: quick double arpeggio (B5-E6)
 */
export function playPaymentChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const playCoin = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        };

        const now = ctx.currentTime;
        playCoin(987.77, now, 0.08); // B5
        playCoin(1318.51, now + 0.05, 0.35); // E6
    } catch (e) {
        console.warn('Audio playPaymentChime blocked or failed:', e);
    }
}

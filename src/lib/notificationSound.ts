/**
 * 알림 사운드 유틸리티
 * Web Audio API를 사용하여 경쾌한 알림 멜로디를 생성합니다.
 * 별도의 mp3 파일 없이 브라우저에서 직접 합성됩니다.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * 경쾌한 3-노트 알림 멜로디를 재생합니다.
 * C5 → E5 → G5 (도-미-솔) 시퀀스
 */
export function playNotificationMelody(): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (autoplay policy)
    if (ctx.state === "suspended") {
        ctx.resume();
    }

    const now = ctx.currentTime;

    // 3-note melody: C5(523Hz) → E5(659Hz) → G5(784Hz)
    const notes = [
        { freq: 523.25, start: 0, duration: 0.15 },
        { freq: 659.25, start: 0.18, duration: 0.15 },
        { freq: 783.99, start: 0.36, duration: 0.25 },
    ];

    notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);

        // Smooth envelope: quick attack, gentle release
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02); // attack
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration); // decay

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
    });
}

/**
 * 사용자의 소리 설정이 켜져 있으면 알림 멜로디를 재생합니다.
 */
export function playIfSoundEnabled(): void {
    if (typeof window === "undefined") return;
    const soundEnabled = localStorage.getItem("your-todo-sound") !== "false";
    if (soundEnabled) {
        playNotificationMelody();
    }
}

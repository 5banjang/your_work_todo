/**
 * 알림 사운드 유틸리티
 * Web Audio API를 사용하여 경쾌한 알림 멜로디를 생성합니다.
 */

let audioCtx: AudioContext | null = null;
let isInitialized = false;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API not supported:", e);
            return null;
        }
    }
    return audioCtx;
}

/**
 * 모바일 브라우저의 autoplay 정책을 우회하기 위해
 * 사용자의 첫 번째 터치/클릭 이벤트에서 AudioContext를 resume합니다.
 * 앱 로드 시 한 번만 호출하면 됩니다.
 */
export function initAudioOnUserGesture(): void {
    if (typeof window === "undefined" || isInitialized) return;

    const unlock = () => {
        const ctx = getAudioContext();
        if (ctx && ctx.state === "suspended") {
            ctx.resume().then(() => {
                console.log("AudioContext resumed on user gesture");
            });
        }
        // 무음 버퍼 재생 (iOS Safari 우회용)
        if (ctx) {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        }
        isInitialized = true;
        // 한 번만 실행하고 리스너 제거
        document.removeEventListener("touchstart", unlock, true);
        document.removeEventListener("touchend", unlock, true);
        document.removeEventListener("click", unlock, true);
    };

    document.addEventListener("touchstart", unlock, true);
    document.addEventListener("touchend", unlock, true);
    document.addEventListener("click", unlock, true);
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

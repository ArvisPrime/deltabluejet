/**
 * useNotificationSound — Web Audio API hook for alert sounds.
 *
 * Generates synthesized tones using the device's audio output.
 * No external sound files required — works on all modern browsers.
 */
import { useCallback, useRef } from 'react';

type AlertLevel = 'critical' | 'warning' | 'info' | 'success';

// Tone definitions (frequency, duration, pattern)
const TONE_CONFIGS: Record<AlertLevel, { freqs: number[]; durations: number[]; gains: number[] }> = {
    critical: {
        // Urgent double-beep: high pitch, short bursts
        freqs: [880, 0, 880, 0, 1100],
        durations: [0.15, 0.08, 0.15, 0.08, 0.25],
        gains: [0.35, 0, 0.35, 0, 0.4],
    },
    warning: {
        // Single rising tone
        freqs: [660, 880],
        durations: [0.2, 0.25],
        gains: [0.25, 0.3],
    },
    info: {
        // Soft single ping
        freqs: [523],
        durations: [0.15],
        gains: [0.15],
    },
    success: {
        // Pleasant two-note chime
        freqs: [523, 659],
        durations: [0.12, 0.18],
        gains: [0.15, 0.18],
    },
};

export function useNotificationSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastPlayedRef = useRef<number>(0);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const playSound = useCallback((level: AlertLevel = 'info') => {
        // Throttle: don't play more than once per 2 seconds
        const now = Date.now();
        if (now - lastPlayedRef.current < 2000) return;
        lastPlayedRef.current = now;

        try {
            const ctx = getAudioContext();
            const config = TONE_CONFIGS[level];
            let startTime = ctx.currentTime;

            config.freqs.forEach((freq, i) => {
                if (freq === 0) {
                    // Silent gap
                    startTime += config.durations[i];
                    return;
                }

                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.type = level === 'critical' ? 'square' : 'sine';
                oscillator.frequency.setValueAtTime(freq, startTime);

                // Envelope: quick attack, sustain, smooth release
                const dur = config.durations[i];
                const peakGain = config.gains[i];
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
                gainNode.gain.setValueAtTime(peakGain, startTime + dur * 0.7);
                gainNode.gain.linearRampToValueAtTime(0, startTime + dur);

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.start(startTime);
                oscillator.stop(startTime + dur);

                startTime += dur;
            });
        } catch (err) {
            console.warn('🔇 Audio playback failed:', err);
        }
    }, [getAudioContext]);

    return { playSound };
}

export default useNotificationSound;

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { isSoundMuted, subscribeSoundMuted } from './soundPreference';

// A soft two-note chime, synthesized with the Web Audio API — no asset file, no
// bundle weight. Played only on a genuine new arrival (count rise), never on poll,
// reload, or mark-read. Silent when muted or the tab is hidden.

// Two ascending notes (C6 → E6), each a short sine with a gentle exp decay.
const NOTES = [
  { freq: 1046.5, start: 0, duration: 0.16 },
  { freq: 1318.5, start: 0.09, duration: 0.22 },
];
const PEAK_GAIN = 0.12; // quiet by design

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

const getAudioContextCtor = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
};

// Subscribes a component to the mute preference so its UI reflects the current state.
export const useSoundMuted = (): boolean => useSyncExternalStore(subscribeSoundMuted, isSoundMuted, () => false);

// Returns a stable playChime() that lazily creates one shared AudioContext on first
// use (must be after a user gesture per browser autoplay policy — the first bell
// interaction or any click satisfies this).
export const useNotificationSound = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const ctx = ctxRef.current;
    return () => {
      void ctx?.close();
    };
  }, []);

  return useCallback(() => {
    if (isSoundMuted()) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const Ctor = getAudioContextCtor();
    if (!Ctor) return; // no Web Audio support → silently skip

    if (!ctxRef.current) ctxRef.current = new Ctor();
    const ctx = ctxRef.current;
    // A context can be suspended until a gesture; resume is a no-op if running.
    void ctx.resume();

    const now = ctx.currentTime;
    for (const note of NOTES) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note.freq;

      const t0 = now + note.start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(PEAK_GAIN, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duration);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + note.duration);
    }
  }, []);
};

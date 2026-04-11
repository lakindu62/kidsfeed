import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a numeric display toward `target` (from previous value, or 0 on first run).
 * @param {number} target
 * @param {{ durationMs?: number, enabled?: boolean }} [options]
 */
export function useCountUp(target, options = {}) {
  const { durationMs = 720, enabled = true } = options;
  const [display, setDisplay] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    if (!enabled || !Number.isFinite(target)) {
      return;
    }

    const from = prefersReducedMotion() ? target : valueRef.current;
    const start = performance.now();
    let raf = 0;
    let cancelled = false;

    const tick = (now) => {
      if (cancelled) return;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      const next = Math.round(from + (target - from) * eased);
      setDisplay(next);
      valueRef.current = next;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        valueRef.current = target;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [target, enabled, durationMs]);

  return display;
}

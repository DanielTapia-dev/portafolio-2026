'use client';

import {useEffect, useRef} from 'react';

// Soft glow that follows the cursor behind the page content.
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Touch screens have no hover position to follow.
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--spotlight-x', `${event.clientX}px`);
        el.style.setProperty('--spotlight-y', `${event.clientY}px`);
        el.style.opacity = '1';
      });
    };

    window.addEventListener('pointermove', onMove, {passive: true});
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(600px circle at var(--spotlight-x) var(--spotlight-y), color-mix(in oklch, var(--primary) 9%, transparent), transparent 80%)'
      }}
    />
  );
}

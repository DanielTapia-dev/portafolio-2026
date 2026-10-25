'use client';

import {useEffect, useRef} from 'react';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  // Stagger siblings by giving each a slightly larger delay.
  delay?: number;
};

// Fades its content up the first time it scrolls into view. Content renders
// visible on the server and is only hidden once JS knows it is below the fold,
// so nothing disappears if scripts are slow or disabled. Styles: globals.css.
export default function Reveal({children, className, delay = 0}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = 'hidden';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = 'shown';
          observer.disconnect();
        }
      },
      {rootMargin: '0px 0px -10% 0px'}
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal="shown"
      style={{transitionDelay: `${delay}ms`}}
      className={className}
    >
      {children}
    </div>
  );
}

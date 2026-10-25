'use client';

import {useEffect, useState} from 'react';
import {cn} from '@/lib/utils';

type SectionNavProps = {
  label: string;
  sections: {id: string; label: string}[];
};

// In-page navigation that highlights the section currently in view.
export default function SectionNav({label, sections}: SectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      // A section is active while it crosses the upper third of the screen.
      {rootMargin: '-30% 0px -65% 0px'}
    );

    for (const {id} of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap gap-x-6 gap-y-3 lg:flex-col"
    >
      {sections.map(({id, label: sectionLabel}) => {
        const isActive = id === activeId;

        return (
          <a
            key={id}
            href={`#${id}`}
            aria-current={isActive ? 'location' : undefined}
            className={cn(
              'group flex items-center gap-3 text-xs font-semibold uppercase tracking-wider transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              className={cn(
                'hidden h-px transition-all duration-300 lg:block',
                isActive
                  ? 'w-16 bg-primary'
                  : 'w-8 bg-muted-foreground group-hover:w-12 group-hover:bg-foreground'
              )}
            />
            {sectionLabel}
          </a>
        );
      })}
    </nav>
  );
}

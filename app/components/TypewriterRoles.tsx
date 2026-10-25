'use client';

import {useEffect, useState, useSyncExternalStore} from 'react';

const TYPE_MS = 70;
const DELETE_MS = 35;
const HOLD_MS = 1800;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

type TypewriterRolesProps = {
  roles: string[];
};

// Types each role, holds it, deletes it and moves to the next one.
export default function TypewriterRoles({roles}: TypewriterRolesProps) {
  const [roleIndex, setRoleIndex] = useState(0);
  // Start fully typed so the first role shows before the animation runs.
  const [length, setLength] = useState(roles[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  // With reduced motion, show the first role without typing.
  const isStatic = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

  const role = roles[roleIndex];

  useEffect(() => {
    if (isStatic) return;

    const isTyped = length === role.length;
    const isCleared = length === 0;

    let delay = isDeleting ? DELETE_MS : TYPE_MS;
    if (!isDeleting && isTyped) delay = HOLD_MS;

    const timeout = setTimeout(() => {
      if (!isDeleting && isTyped) {
        setIsDeleting(true);
      } else if (isDeleting && isCleared) {
        setIsDeleting(false);
        setRoleIndex((index) => (index + 1) % roles.length);
      } else {
        setLength((current) => current + (isDeleting ? -1 : 1));
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [isStatic, isDeleting, length, role, roles.length]);

  return (
    <>
      {/* Screen readers get the first role once instead of every keystroke. */}
      <span className="sr-only">{roles[0]}</span>
      <span aria-hidden>
        {isStatic ? roles[0] : role.slice(0, length)}
        <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] bg-primary animate-caret" />
      </span>
    </>
  );
}

'use client';

import {AlertTriangle, RotateCcw} from 'lucide-react';

// Unexpected failures only; query errors are shown inside each section.
export default function AnalyticsError({reset}: {reset: () => void}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={28} className="text-amber-300" />
      <h1 className="text-xl font-semibold text-foreground">
        The dashboard could not be loaded
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Something went wrong while preparing your analytics. The details are in
        the server logs; no data was lost.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50"
      >
        <RotateCcw size={16} />
        Try again
      </button>
    </div>
  );
}

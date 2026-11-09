// Shown while the PostHog queries run.
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading analytics…</span>
      <div className="space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded bg-secondary" />
        <div className="h-3 w-96 max-w-full animate-pulse rounded bg-secondary" />
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-card/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {Array.from({length: 5}, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card/60" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card/60" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-card/60" />
      </div>
    </div>
  );
}

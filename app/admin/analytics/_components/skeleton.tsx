// Placeholder shown while the PostHog queries run, on first load and when a
// filter changes.
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading analytics…</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        {Array.from({length: 3}, (_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-border bg-card/60"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card/60" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card/60 lg:col-span-3" />
        <div className="h-72 animate-pulse rounded-xl border border-border bg-card/60 lg:col-span-2" />
      </div>
    </div>
  );
}

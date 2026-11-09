import DashboardSkeleton from './_components/skeleton';

// First load only; filter changes stream into the page's own Suspense boundary.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-72 max-w-full animate-pulse rounded bg-secondary" />
        <div className="h-3 w-96 max-w-full animate-pulse rounded bg-secondary" />
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-card/60" />
      <DashboardSkeleton />
    </div>
  );
}

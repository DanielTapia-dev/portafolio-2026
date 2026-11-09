// Number and duration formatting for the admin dashboard.

const integer = new Intl.NumberFormat('en');
const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
});

export const formatCount = (value: number) =>
  value >= 10_000 ? compact.format(value) : integer.format(value);

export const formatPercent = (ratio: number, digits = 0) =>
  `${(ratio * 100).toFixed(digits)}%`;

export function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export type Delta =
  | {kind: 'none'}
  | {kind: 'new'}
  | {kind: 'change'; ratio: number};

// Relative change against the previous period. Rates compare in points.
export function computeDelta(
  current: number | null,
  previous: number | null
): Delta {
  if (current === null || previous === null) return {kind: 'none'};
  if (previous === 0) return current === 0 ? {kind: 'none'} : {kind: 'new'};
  return {kind: 'change', ratio: (current - previous) / previous};
}

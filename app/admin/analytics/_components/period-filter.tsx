import Link from 'next/link';
import {CalendarRange} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  GRANULARITIES,
  MAX_CUSTOM_DAYS,
  RANGE_PRESETS,
  type DashboardRange,
  type Granularity
} from '@/lib/analytics/range';

const PRESET_LABELS = {'7d': '7 days', '30d': '30 days', '90d': '90 days'};
const GRANULARITY_LABELS: Record<Granularity, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly'
};

const pill = (active: boolean) =>
  cn(
    'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'bg-primary/15 text-primary'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
  );

function rangeQuery(range: DashboardRange) {
  return range.preset === 'custom'
    ? {range: 'custom', from: range.current.from, to: range.current.to}
    : {range: range.preset};
}

// Works without JavaScript: presets and granularity are links, the custom
// range is a GET form.
export default function PeriodFilter({
  range,
  today
}: {
  range: DashboardRange;
  today: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Period" className="flex flex-wrap gap-1">
          {RANGE_PRESETS.map((preset) => (
            <Link
              key={preset}
              href={{pathname: '/admin/analytics', query: {range: preset}}}
              aria-current={range.preset === preset ? 'page' : undefined}
              className={pill(range.preset === preset)}
            >
              {PRESET_LABELS[preset]}
            </Link>
          ))}
        </nav>
        <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
        <nav aria-label="Chart interval" className="flex flex-wrap gap-1">
          {GRANULARITIES.map((granularity) => (
            <Link
              key={granularity}
              href={{
                pathname: '/admin/analytics',
                query: {...rangeQuery(range), granularity}
              }}
              aria-current={range.granularity === granularity ? 'true' : undefined}
              className={pill(range.granularity === granularity)}
            >
              {GRANULARITY_LABELS[granularity]}
            </Link>
          ))}
        </nav>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-2"
        aria-label="Custom range"
      >
        <input type="hidden" name="range" value="custom" />
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From
          <input
            type="date"
            name="from"
            required
            max={today}
            defaultValue={range.current.from}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground [color-scheme:dark]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To
          <input
            type="date"
            name="to"
            required
            max={today}
            defaultValue={range.current.to}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground [color-scheme:dark]"
          />
        </label>
        <button
          type="submit"
          title={`Up to ${MAX_CUSTOM_DAYS} days`}
          className={cn(
            pill(range.preset === 'custom'),
            'gap-1.5 border border-border'
          )}
        >
          <CalendarRange size={15} />
          Apply
        </button>
      </form>
    </div>
  );
}

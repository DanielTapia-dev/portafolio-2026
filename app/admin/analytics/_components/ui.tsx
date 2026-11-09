import {AlertTriangle, ArrowDownRight, ArrowUpRight, Minus} from 'lucide-react';
import type {CountRow, Section} from '@/lib/analytics/dashboard';
import {
  computeDelta,
  formatCount,
  formatPercent,
  type Delta
} from '@/lib/analytics/format';
import {cn} from '@/lib/utils';
import {CHART_CURRENT} from './chart-colors';

export function Card({
  title,
  description,
  className,
  children
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-xl border border-border bg-card/60 p-4 sm:p-5',
        className
      )}
    >
      <header className="mb-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export function SectionError({message}: {message: string}) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}

export function EmptyRows({children}: {children: React.ReactNode}) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

// Renders a section, its error, or its empty state.
export function SectionBody<T>({
  section,
  isEmpty,
  empty,
  children
}: {
  section: Section<T>;
  isEmpty: (data: T) => boolean;
  empty: string;
  children: (data: T) => React.ReactNode;
}) {
  if (!section.ok) return <SectionError message={section.error} />;
  if (isEmpty(section.data)) return <EmptyRows>{empty}</EmptyRows>;
  return <>{children(section.data)}</>;
}

// Ranked list with a magnitude bar. Shares are of the listed total.
export function BarList({
  rows,
  unit,
  total
}: {
  rows: CountRow[];
  unit: string;
  total?: number;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  const sum = total ?? rows.reduce((acc, row) => acc + row.value, 0);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="text-foreground">{formatCount(row.value)}</span>
              <span className="sr-only"> {unit}</span>
              {sum > 0 && (
                <span className="ml-2 text-xs">
                  {formatPercent(row.value / sum)}
                </span>
              )}
            </span>
          </div>
          <div aria-hidden className="h-1.5 rounded-full bg-border/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((row.value / max) * 100, 2)}%`,
                backgroundColor: CHART_CURRENT
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DeltaBadge({delta, upIsGood}: {delta: Delta; upIsGood: boolean}) {
  if (delta.kind === 'none') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus size={13} aria-hidden />
        No change data
      </span>
    );
  }
  if (delta.kind === 'new') {
    return (
      <span className="text-xs text-muted-foreground">
        None in the previous period
      </span>
    );
  }

  const isUp = delta.ratio > 0;
  const isFlat = Math.abs(delta.ratio) < 0.005;
  const isGood = isFlat ? null : isUp === upIsGood;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        isGood === null
          ? 'text-muted-foreground'
          : isGood
            ? 'text-emerald-400'
            : 'text-rose-400'
      )}
    >
      <Icon size={14} aria-hidden />
      {isFlat ? 'No change' : `${isUp ? '+' : ''}${formatPercent(delta.ratio)}`}
      <span className="font-normal text-muted-foreground">vs previous</span>
    </span>
  );
}

export function KpiTile({
  label,
  value,
  current,
  previous,
  upIsGood = true,
  hint
}: {
  label: string;
  value: string;
  current: number | null;
  previous: number | null;
  upIsGood?: boolean;
  hint: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-card/60 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <DeltaBadge delta={computeDelta(current, previous)} upIsGood={upIsGood} />
      <p className="text-xs leading-relaxed text-muted-foreground/80">{hint}</p>
    </div>
  );
}

'use client';

import {useEffect, useId, useRef, useState} from 'react';
import type {TrendPoint} from '@/lib/analytics/dashboard';
import {formatCount} from '@/lib/analytics/format';
import type {Granularity} from '@/lib/analytics/range';
import {cn} from '@/lib/utils';
import {CHART_CURRENT, CHART_PREVIOUS} from './chart-colors';

type Metric = 'pageviews' | 'sessions';

const METRICS: {id: Metric; label: string}[] = [
  {id: 'sessions', label: 'Visits'},
  {id: 'pageviews', label: 'Page views'}
];

const HEIGHT = 260;
const PAD = {top: 16, right: 16, bottom: 30, left: 44};
const SURFACE = 'var(--card)';

function bucketLabel(date: string, granularity: Granularity, long = false) {
  const d = new Date(`${date}T00:00:00Z`);
  if (granularity === 'month') {
    return new Intl.DateTimeFormat('en-GB', {
      month: long ? 'long' : 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(d);
  }
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(long ? {year: 'numeric'} : {}),
    timeZone: 'UTC'
  }).format(d);
  return granularity === 'week' && long ? `Week of ${day}` : day;
}

// Clean axis ticks: 0 and steps of 1, 2 or 5 × 10^n.
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? power * 10;
  const ticks: number[] = [];
  for (let value = 0; value <= max + step * 0.001; value += step) ticks.push(value);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

export default function TrafficChart({
  points,
  granularity
}: {
  points: TrendPoint[];
  granularity: Granularity;
}) {
  const [metric, setMetric] = useState<Metric>('sessions');
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const current = points.map((p) => p[metric]);
  const previous = points.map((p) =>
    metric === 'pageviews' ? p.previousPageviews : p.previousSessions
  );
  const ticks = niceTicks(
    Math.max(...current, ...previous.map((v) => v ?? 0), 0)
  );
  const yMax = ticks[ticks.length - 1];

  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? plotWidth / 2 : (i * plotWidth) / (points.length - 1));
  const y = (v: number) => PAD.top + plotHeight - (v / yMax) * plotHeight;

  const linePath = (values: (number | null)[]) =>
    values
      .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .map((point, i) => `${i === 0 ? 'M' : 'L'}${point}`)
      .join(' ');

  const currentPath = linePath(current);
  const areaPath =
    points.length > 1
      ? `${currentPath} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
      : '';
  const previousPath = linePath(previous);

  // Roughly one x label per 90px, always including the last bucket.
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(plotWidth / 90, 1)));
  const xLabels = points
    .map((p, i) => ({i, label: bucketLabel(p.bucket, granularity)}))
    .filter(({i}) => i % labelEvery === 0 || i === points.length - 1)
    .filter(({i}, index, all) =>
      // Drop a label that would collide with the final one.
      i === points.length - 1 || all[all.length - 1].i - i >= labelEvery * 0.75 || index === 0
    );

  const indexFromPointer = (clientX: number, target: Element) => {
    const rect = target.getBoundingClientRect();
    const relative = clientX - rect.left - PAD.left;
    const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
    return Math.min(points.length - 1, Math.max(0, Math.round(relative / step)));
  };

  const activePoint = active === null ? null : points[active];
  const metricLabel = METRICS.find((m) => m.id === metric)!.label;
  const tooltipLeft = active === null ? 0 : x(active);
  const flip = tooltipLeft > width / 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Metric" className="flex gap-1 rounded-lg bg-secondary/60 p-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metric === m.id}
              onClick={() => setMetric(m.id)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                metric === m.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{backgroundColor: CHART_CURRENT}} />
            Selected period
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{backgroundColor: CHART_PREVIOUS}} />
            Previous period
          </li>
        </ul>
      </div>

      <div
        ref={containerRef}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg"
        style={{height: HEIGHT}}
        tabIndex={0}
        role="group"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-hint`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 1 : -1;
            setActive((i) =>
              Math.min(points.length - 1, Math.max(0, (i ?? (delta > 0 ? -1 : points.length)) + delta))
            );
          }
          if (event.key === 'Escape') setActive(null);
        }}
        onBlur={() => setActive(null)}
      >
        <span id={titleId} className="sr-only">
          {metricLabel} over time, selected period compared with the previous period
        </span>
        <span id={`${titleId}-hint`} className="sr-only">
          Use the left and right arrow keys to read each value.
        </span>

        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            aria-hidden
            onPointerMove={(event) => setActive(indexFromPointer(event.clientX, event.currentTarget))}
            onPointerLeave={() => setActive(null)}
            className="touch-pan-y"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {formatCount(tick)}
                </text>
              </g>
            ))}

            {xLabels.map(({i, label}) => (
              <text
                key={i}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}
                className="fill-muted-foreground text-[11px]"
              >
                {label}
              </text>
            ))}

            {areaPath && <path d={areaPath} fill={CHART_CURRENT} opacity={0.1} />}
            {previousPath && (
              <path
                d={previousPath}
                fill="none"
                stroke={CHART_PREVIOUS}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <path
              d={currentPath}
              fill="none"
              stroke={CHART_CURRENT}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {active === null && points.length > 0 && (
              <circle
                cx={x(points.length - 1)}
                cy={y(current[points.length - 1])}
                r={4}
                fill={CHART_CURRENT}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )}

            {active !== null && (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={PAD.top + plotHeight}
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                />
                {previous[active] !== null && (
                  <circle
                    cx={x(active)}
                    cy={y(previous[active]!)}
                    r={4}
                    fill={CHART_PREVIOUS}
                    stroke={SURFACE}
                    strokeWidth={2}
                  />
                )}
                <circle
                  cx={x(active)}
                  cy={y(current[active])}
                  r={5}
                  fill={CHART_CURRENT}
                  stroke={SURFACE}
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        )}

        {activePoint && active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
            style={
              flip
                ? {right: Math.max(width - tooltipLeft + 12, 0)}
                : {left: tooltipLeft + 12}
            }
          >
            <p className="mb-1.5 font-medium text-foreground">{metricLabel}</p>
            <p className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{backgroundColor: CHART_CURRENT}} />
                {bucketLabel(activePoint.bucket, granularity, true)}
              </span>
              <span className="tabular-nums text-foreground">
                {formatCount(current[active])}
              </span>
            </p>
            {activePoint.previousBucket && previous[active] !== null && (
              <p className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{backgroundColor: CHART_PREVIOUS}} />
                  {bucketLabel(activePoint.previousBucket, granularity, true)}
                </span>
                <span className="tabular-nums text-foreground">
                  {formatCount(previous[active]!)}
                </span>
              </p>
            )}
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {activePoint && active !== null
            ? `${bucketLabel(activePoint.bucket, granularity, true)}: ${formatCount(current[active])} ${metricLabel.toLowerCase()}` +
              (previous[active] !== null && activePoint.previousBucket
                ? `; previous period ${bucketLabel(activePoint.previousBucket, granularity, true)}: ${formatCount(previous[active]!)}`
                : '')
            : ''}
        </p>
      </div>

      <details className="group text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          Show as a table
        </summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Period</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Page views</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Visits</th>
                <th scope="col" className="px-3 py-2 font-medium">Compared with</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Page views</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Visits</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {points.map((p) => (
                <tr key={p.bucket} className="border-t border-border">
                  <td className="px-3 py-1.5 text-foreground">{bucketLabel(p.bucket, granularity, true)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCount(p.pageviews)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCount(p.sessions)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {p.previousBucket ? bucketLabel(p.previousBucket, granularity, true) : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {p.previousPageviews === null ? '—' : formatCount(p.previousPageviews)}
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {p.previousSessions === null ? '—' : formatCount(p.previousSessions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

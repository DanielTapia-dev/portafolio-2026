// Resolves the dashboard's period from the URL. Pure functions, no I/O.
// Dates are calendar days (YYYY-MM-DD) in the dashboard's time zone, and
// both ends are inclusive.

export const RANGE_PRESETS = ['7d', '30d', '90d'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export const GRANULARITIES = ['day', 'week', 'month'] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const MAX_CUSTOM_DAYS = 366;
const PRESET_DAYS: Record<RangePreset, number> = {'7d': 7, '30d': 30, '90d': 90};
const DEFAULT_PRESET: RangePreset = '30d';

export type Period = {from: string; to: string};

export type DashboardRange = {
  preset: RangePreset | 'custom';
  current: Period;
  previous: Period;
  days: number;
  granularity: Granularity;
  timeZone: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const toUtcDate = (date: string) => new Date(`${date}T00:00:00Z`);
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (date: string, days: number) =>
  formatDate(new Date(toUtcDate(date).getTime() + days * DAY_MS));

export const daysBetween = (from: string, to: string) =>
  Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / DAY_MS) + 1;

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  return formatDate(toUtcDate(value)) === value;
}

// ANALYTICS_TIME_ZONE (IANA name, e.g. America/Guayaquil); UTC by default.
export function resolveTimeZone(value = process.env.ANALYTICS_TIME_ZONE) {
  if (!value) return 'UTC';
  try {
    new Intl.DateTimeFormat('en', {timeZone: value});
    return /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(value) ? value : 'UTC';
  } catch {
    return 'UTC';
  }
}

export function todayIn(timeZone: string, now = new Date()) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

const defaultGranularity = (days: number): Granularity =>
  days <= 31 ? 'day' : days <= 180 ? 'week' : 'month';

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function resolveRange(
  searchParams: SearchParams,
  {timeZone = resolveTimeZone(), now = new Date()} = {}
): {range: DashboardRange; error?: string} {
  const today = todayIn(timeZone, now);
  const requested = first(searchParams.range);
  let error: string | undefined;

  let preset: DashboardRange['preset'] = DEFAULT_PRESET;
  let current: Period = {
    from: addDays(today, -(PRESET_DAYS[DEFAULT_PRESET] - 1)),
    to: today
  };

  if (requested === 'custom') {
    const from = first(searchParams.from);
    const to = first(searchParams.to);
    if (!isValidDate(from) || !isValidDate(to)) {
      error = 'Pick both a start and an end date.';
    } else if (from > to) {
      error = 'The start date must be on or before the end date.';
    } else if (from > today) {
      error = 'The range starts in the future.';
    } else {
      const end = to > today ? today : to;
      if (daysBetween(from, end) > MAX_CUSTOM_DAYS) {
        error = `Custom ranges can span at most ${MAX_CUSTOM_DAYS} days.`;
      } else {
        preset = 'custom';
        current = {from, to: end};
      }
    }
  } else if (
    requested &&
    (RANGE_PRESETS as readonly string[]).includes(requested)
  ) {
    preset = requested as RangePreset;
    current = {from: addDays(today, -(PRESET_DAYS[preset] - 1)), to: today};
  }

  const days = daysBetween(current.from, current.to);
  const previous = {
    from: addDays(current.from, -days),
    to: addDays(current.from, -1)
  };

  const requestedGranularity = first(searchParams.granularity);
  const granularity = (GRANULARITIES as readonly string[]).includes(
    requestedGranularity ?? ''
  )
    ? (requestedGranularity as Granularity)
    : defaultGranularity(days);

  return {
    range: {preset, current, previous, days, granularity, timeZone},
    error
  };
}

// Start date of every bucket in a period, so empty days still show as zero.
export function bucketStarts(period: Period, granularity: Granularity) {
  const starts: string[] = [];
  let cursor = bucketStart(period.from, granularity);
  while (cursor <= period.to) {
    starts.push(cursor);
    cursor =
      granularity === 'day'
        ? addDays(cursor, 1)
        : granularity === 'week'
          ? addDays(cursor, 7)
          : nextMonth(cursor);
  }
  return starts;
}

// Weeks start on Monday, matching toStartOfWeek(…, 1) in the queries.
export function bucketStart(date: string, granularity: Granularity) {
  if (granularity === 'day') return date;
  if (granularity === 'month') return `${date.slice(0, 7)}-01`;
  const weekday = (toUtcDate(date).getUTCDay() + 6) % 7;
  return addDays(date, -weekday);
}

function nextMonth(date: string) {
  const d = toUtcDate(date);
  return formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
}

export function formatDay(date: string, options?: {withYear?: boolean}) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(options?.withYear ? {year: 'numeric'} : {}),
    timeZone: 'UTC'
  }).format(toUtcDate(date));
}

export const formatPeriod = (period: Period) =>
  `${formatDay(period.from, {withYear: true})} – ${formatDay(period.to, {withYear: true})}`;

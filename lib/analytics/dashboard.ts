import 'server-only';
import {unstable_cache} from 'next/cache';
import {requireAdmin} from '@/lib/admin/require-admin';
import {
  AnalyticsQueryError,
  getPostHogQueryConfig,
  runHogQL,
  type PostHogQueryConfig
} from './posthog';
import {addDays, bucketStarts, type DashboardRange} from './range';

// The dashboard runs three small queries, all at once (PostHog allows three
// concurrent queries per project), and caches each result for a few minutes so
// switching back to a period is instant. Each section loads on its own, so one
// failing query shows an error in its card instead of breaking the page.

export const CACHE_SECONDS = 300;

export type Section<T> = {ok: true; data: T} | {ok: false; error: string};

export type PeriodTotals = {pageviews: number; visits: number};

export type TrendPoint = {
  bucket: string;
  previousBucket: string | null;
  pageviews: number;
  sessions: number;
  previousPageviews: number | null;
  previousSessions: number | null;
};

export type Traffic = {
  current: PeriodTotals;
  previous: PeriodTotals;
  trend: TrendPoint[];
};

export type CountRow = {label: string; value: number};

export type Geography = {countries: CountRow[]; regions: CountRow[]};

export type PageRow = {path: string; views: number; visits: number};

export type DashboardData = {
  traffic: Section<Traffic>;
  geography: Section<Geography>;
  pages: Section<PageRow[]>;
};

// -- SQL helpers ------------------------------------------------------------

// Quotes a value that is already validated (dates, time zone).
const str = (value: string) =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function bounds(range: DashboardRange) {
  const tz = str(range.timeZone);
  const at = (date: string) => `toDateTime(${str(`${date} 00:00:00`)}, ${tz})`;
  return {
    tz,
    currentFrom: at(range.current.from),
    currentTo: at(addDays(range.current.to, 1)),
    previousFrom: at(range.previous.from)
  };
}

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

const BUCKET_SQL = {
  day: (tz: string) => `toStartOfDay(toTimeZone(timestamp, ${tz}))`,
  week: (tz: string) => `toStartOfWeek(toTimeZone(timestamp, ${tz}), 1)`,
  month: (tz: string) => `toStartOfMonth(toTimeZone(timestamp, ${tz}))`
};

// Query results are cached per project and SQL text, which already encodes
// the period, the interval and the time zone.
const cachedQuery = unstable_cache(
  async (projectId: string, name: string, query: string) => {
    const config = getPostHogQueryConfig();
    if (!config || config.projectId !== projectId) {
      throw new AnalyticsQueryError('PostHog is not configured.');
    }
    return runHogQL<unknown[]>(config, name, query);
  },
  ['admin-analytics-v2'],
  {revalidate: CACHE_SECONDS}
);

const query = (config: PostHogQueryConfig, name: string, sql: string) =>
  cachedQuery(config.projectId, name, sql);

// -- Queries ----------------------------------------------------------------

// Totals for both periods and the per-bucket trend, in a single query.
async function loadTraffic(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const period = `if(timestamp >= ${b.currentFrom}, 'current', 'previous')`;
  const where = `event = '$pageview' AND timestamp >= ${b.previousFrom} AND timestamp < ${b.currentTo}`;

  const rows = await query(
    config,
    'admin: traffic',
    `SELECT 'total' AS kind, ${period} AS period, '' AS bucket,
        count() AS pageviews, uniq($session_id) AS visits
      FROM events WHERE ${where}
      GROUP BY period
    UNION ALL
    SELECT 'bucket' AS kind, ${period} AS period,
        formatDateTime(${BUCKET_SQL[range.granularity](b.tz)}, '%Y-%m-%d') AS bucket,
        count() AS pageviews, uniq($session_id) AS visits
      FROM events WHERE ${where}
      GROUP BY period, bucket`
  );

  const totals = (period: string): PeriodTotals => {
    const row = rows.find((r) => r[0] === 'total' && r[1] === period);
    return {pageviews: num(row?.[3]), visits: num(row?.[4])};
  };

  const byKey = new Map(
    rows.filter((r) => r[0] === 'bucket').map((r) => [`${r[1]}:${r[2]}`, r])
  );
  const currentBuckets = bucketStarts(range.current, range.granularity);
  const previousBuckets = bucketStarts(range.previous, range.granularity);
  // Previous buckets are aligned by position: day 1 against day 1, and so on.
  const offset = previousBuckets.length - currentBuckets.length;

  const trend = currentBuckets.map((bucket, index): TrendPoint => {
    const current = byKey.get(`current:${bucket}`);
    const previousBucket = previousBuckets[index + offset] ?? null;
    const previous = previousBucket ? byKey.get(`previous:${previousBucket}`) : undefined;
    return {
      bucket,
      previousBucket,
      pageviews: num(current?.[3]),
      sessions: num(current?.[4]),
      previousPageviews: previousBucket ? num(previous?.[3]) : null,
      previousSessions: previousBucket ? num(previous?.[4]) : null
    };
  });

  return {current: totals('current'), previous: totals('previous'), trend};
}

// Visits per country and region; countries are summed from the regions.
async function loadGeography(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await query(
    config,
    'admin: geography',
    `SELECT
      properties.$geoip_country_name AS country,
      properties.$geoip_subdivision_1_name AS region,
      uniq($session_id) AS visits
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}
    GROUP BY country, region
    ORDER BY visits DESC
    LIMIT 200`
  );

  const countries = new Map<string, number>();
  const regions: CountRow[] = [];
  for (const [countryValue, regionValue, visits] of rows) {
    const country = text(countryValue, 'Unknown');
    countries.set(country, (countries.get(country) ?? 0) + num(visits));
    if (typeof regionValue === 'string' && regionValue.trim()) {
      regions.push({label: `${regionValue}, ${country}`, value: num(visits)});
    }
  }

  return {
    countries: [...countries]
      .map(([label, value]) => ({label, value}))
      .sort((a, z) => z.value - a.value)
      .slice(0, 10),
    regions: regions.sort((a, z) => z.value - a.value).slice(0, 10)
  };
}

async function loadPages(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await query(
    config,
    'admin: top pages',
    `SELECT properties.$pathname AS path, count() AS views, uniq($session_id) AS visits
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10`
  );
  return rows.map(([path, views, visits]) => ({
    path: text(path, '(unknown)'),
    views: num(views),
    visits: num(visits)
  }));
}

// -- Entry point --------------------------------------------------------------

async function settle<T>(load: () => Promise<T>): Promise<Section<T>> {
  try {
    return {ok: true, data: await load()};
  } catch (error) {
    if (error instanceof AnalyticsQueryError) return {ok: false, error: error.message};
    console.error('[analytics] section failed', error);
    return {ok: false, error: 'This section could not be loaded.'};
  }
}

export async function getDashboardData(
  range: DashboardRange
): Promise<DashboardData | null> {
  await requireAdmin();
  const config = getPostHogQueryConfig();
  if (!config) return null;

  const [traffic, geography, pages] = await Promise.all([
    settle(() => loadTraffic(config, range)),
    settle(() => loadGeography(config, range)),
    settle(() => loadPages(config, range))
  ]);

  return {traffic, geography, pages};
}

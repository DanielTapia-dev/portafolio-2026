import 'server-only';
import {requireAdmin} from '@/lib/admin/require-admin';
import {ANALYTICS_EVENTS, isAnalyticsEvent, type AnalyticsEvent} from './events';
import {
  AnalyticsQueryError,
  getPostHogQueryConfig,
  runHogQL,
  type PostHogQueryConfig
} from './posthog';
import {addDays, bucketStarts, type DashboardRange} from './range';

// Builds every dashboard section from PostHog. Each section loads on its own,
// so one failing query shows an error in its card instead of breaking the page.

export type Section<T> = {ok: true; data: T} | {ok: false; error: string};

export type PeriodTotals = {
  pageviews: number;
  sessions: number;
  sessionsWithAction: number;
  avgSessionSeconds: number | null;
  bounceRate: number | null;
};

export type Overview = {current: PeriodTotals; previous: PeriodTotals};

export type TrendPoint = {
  bucket: string;
  previousBucket: string | null;
  pageviews: number;
  sessions: number;
  previousPageviews: number | null;
  previousSessions: number | null;
};

export type PageRow = {
  path: string;
  views: number;
  sessions: number;
  medianSeconds: number | null;
};

export type CountRow = {label: string; value: number};

export type ActionRow = {
  event: AnalyticsEvent;
  total: number;
  sessions: number;
  details: CountRow[];
};

export type FlowRow = {from: string; to: string; count: number};

export type UtmRow = {
  source: string;
  medium: string | null;
  campaign: string | null;
  sessions: number;
};

export type DashboardData = {
  overview: Section<Overview>;
  trend: Section<TrendPoint[]>;
  pages: Section<PageRow[]>;
  sources: Section<{sources: CountRow[]; referrers: CountRow[]}>;
  channels: Section<CountRow[]>;
  utm: Section<UtmRow[]>;
  countries: Section<CountRow[]>;
  technology: Section<{devices: CountRow[]; browsers: CountRow[]; os: CountRow[]}>;
  actions: Section<ActionRow[]>;
  flows: Section<FlowRow[]>;
};

// -- SQL helpers ------------------------------------------------------------

// Quotes a value that is already validated (dates, time zone, event names).
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

const ACTION_EVENTS_SQL = ANALYTICS_EVENTS.map(str).join(', ');

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (value: unknown) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? null
    : Number(value);
const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

// -- Traffic sources --------------------------------------------------------

const SOURCE_PATTERNS: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'LinkedIn'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'YouTube'],
  [/(^|\.)github\.com$/, 'GitHub'],
  [/(^|\.)(x|twitter)\.com$|^t\.co$/, 'X (Twitter)'],
  [/(^|\.)facebook\.com$|^fb\.me$/, 'Facebook'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)reddit\.com$/, 'Reddit'],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, 'ChatGPT']
];

function sourceName(domain: string) {
  if (domain === '$direct') return 'Direct';
  const ownHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (domain === ownHost || domain === 'localhost') return 'This site';
  return SOURCE_PATTERNS.find(([pattern]) => pattern.test(domain))?.[1] ?? domain;
}

function sumBy(rows: CountRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.label, (totals.get(row.label) ?? 0) + row.value);
  return [...totals]
    .map(([label, value]) => ({label, value}))
    .sort((a, b) => b.value - a.value);
}

// -- Queries ----------------------------------------------------------------

async function loadOverview(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const [[events = []], [sessions = []]] = await Promise.all([
    runHogQL(
      config,
      'admin: overview',
      `SELECT
        countIf(event = '$pageview' AND timestamp >= ${b.currentFrom}),
        uniqIf($session_id, event = '$pageview' AND timestamp >= ${b.currentFrom}),
        uniqIf($session_id, event IN (${ACTION_EVENTS_SQL}) AND timestamp >= ${b.currentFrom}),
        countIf(event = '$pageview' AND timestamp < ${b.currentFrom}),
        uniqIf($session_id, event = '$pageview' AND timestamp < ${b.currentFrom}),
        uniqIf($session_id, event IN (${ACTION_EVENTS_SQL}) AND timestamp < ${b.currentFrom})
      FROM events
      WHERE event IN ('$pageview', ${ACTION_EVENTS_SQL})
        AND timestamp >= ${b.previousFrom} AND timestamp < ${b.currentTo}`
    ),
    runHogQL(
      config,
      'admin: session quality',
      `SELECT
        avgIf($session_duration, $start_timestamp >= ${b.currentFrom}),
        countIf($is_bounce AND $start_timestamp >= ${b.currentFrom}),
        countIf($start_timestamp >= ${b.currentFrom}),
        avgIf($session_duration, $start_timestamp < ${b.currentFrom}),
        countIf($is_bounce AND $start_timestamp < ${b.currentFrom}),
        countIf($start_timestamp < ${b.currentFrom})
      FROM sessions
      WHERE $start_timestamp >= ${b.previousFrom} AND $start_timestamp < ${b.currentTo}
        AND $pageview_count > 0`
    )
  ]);

  const totals = (offset: number): PeriodTotals => {
    const sessionCount = num(sessions[offset + 2]);
    return {
      pageviews: num(events[offset]),
      sessions: num(events[offset + 1]),
      sessionsWithAction: num(events[offset + 2]),
      avgSessionSeconds: sessionCount ? numOrNull(sessions[offset]) : null,
      bounceRate: sessionCount ? num(sessions[offset + 1]) / sessionCount : null
    };
  };

  return {current: totals(0), previous: totals(3)};
}

const BUCKET_SQL = {
  day: (tz: string) => `toStartOfDay(toTimeZone(timestamp, ${tz}))`,
  week: (tz: string) => `toStartOfWeek(toTimeZone(timestamp, ${tz}), 1)`,
  month: (tz: string) => `toStartOfMonth(toTimeZone(timestamp, ${tz}))`
};

async function loadTrend(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string, string, number, number]>(
    config,
    'admin: trend',
    `SELECT
      if(timestamp >= ${b.currentFrom}, 'current', 'previous') AS period,
      formatDateTime(${BUCKET_SQL[range.granularity](b.tz)}, '%Y-%m-%d') AS bucket,
      count() AS pageviews,
      uniq($session_id) AS sessions
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= ${b.previousFrom} AND timestamp < ${b.currentTo}
    GROUP BY period, bucket
    ORDER BY bucket`
  );

  const byKey = new Map(rows.map((row) => [`${row[0]}:${row[1]}`, row]));
  const currentBuckets = bucketStarts(range.current, range.granularity);
  const previousBuckets = bucketStarts(range.previous, range.granularity);
  // Previous buckets are aligned by position: day 1 against day 1, and so on.
  const offset = previousBuckets.length - currentBuckets.length;

  return currentBuckets.map((bucket, index): TrendPoint => {
    const current = byKey.get(`current:${bucket}`);
    const previousBucket = previousBuckets[index + offset] ?? null;
    const previous = previousBucket ? byKey.get(`previous:${previousBucket}`) : undefined;
    return {
      bucket,
      previousBucket,
      pageviews: num(current?.[2]),
      sessions: num(current?.[3]),
      previousPageviews: previousBucket ? num(previous?.[2]) : null,
      previousSessions: previousBucket ? num(previous?.[3]) : null
    };
  });
}

async function loadPages(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const inRange = `timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}`;
  const [views, durations] = await Promise.all([
    runHogQL<[string | null, number, number]>(
      config,
      'admin: top pages',
      `SELECT properties.$pathname AS path, count() AS views, uniq($session_id) AS sessions
      FROM events
      WHERE event = '$pageview' AND ${inRange}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 15`
    ),
    // $prev_pageview_duration is sent with the next pageview or the pageleave.
    runHogQL<[string | null, number]>(
      config,
      'admin: time on page',
      `SELECT
        properties.$prev_pageview_pathname AS path,
        median(toFloat(properties.$prev_pageview_duration)) AS seconds
      FROM events
      WHERE event IN ('$pageview', '$pageleave') AND ${inRange}
        AND properties.$prev_pageview_pathname IS NOT NULL
        AND properties.$prev_pageview_duration IS NOT NULL
      GROUP BY path`
    )
  ]);

  const medians = new Map(durations.map(([path, seconds]) => [path, numOrNull(seconds)]));
  return views.map(([path, count, sessions]) => ({
    path: text(path, '(unknown)'),
    views: num(count),
    sessions: num(sessions),
    medianSeconds: medians.get(path) ?? null
  }));
}

async function loadSources(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string | null, number]>(
    config,
    'admin: referring domains',
    `SELECT $entry_referring_domain AS domain, count() AS sessions
    FROM sessions
    WHERE $start_timestamp >= ${b.currentFrom} AND $start_timestamp < ${b.currentTo}
      AND $pageview_count > 0
    GROUP BY domain
    ORDER BY sessions DESC
    LIMIT 50`
  );

  const domains = rows.map(([domain, sessions]) => ({
    label: text(domain, '$direct'),
    value: num(sessions)
  }));
  return {
    sources: sumBy(domains.map((row) => ({...row, label: sourceName(row.label)}))),
    referrers: domains.filter((row) => row.label !== '$direct').slice(0, 10)
  };
}

async function loadChannels(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string | null, number]>(
    config,
    'admin: channels',
    `SELECT $channel_type AS channel, count() AS sessions
    FROM sessions
    WHERE $start_timestamp >= ${b.currentFrom} AND $start_timestamp < ${b.currentTo}
      AND $pageview_count > 0
    GROUP BY channel
    ORDER BY sessions DESC`
  );
  return rows.map(([channel, sessions]) => ({
    label: text(channel, 'Unknown'),
    value: num(sessions)
  }));
}

async function loadUtm(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string, string | null, string | null, number]>(
    config,
    'admin: utm',
    `SELECT
      $entry_utm_source AS source,
      $entry_utm_medium AS medium,
      $entry_utm_campaign AS campaign,
      count() AS sessions
    FROM sessions
    WHERE $start_timestamp >= ${b.currentFrom} AND $start_timestamp < ${b.currentTo}
      AND $pageview_count > 0
      AND $entry_utm_source IS NOT NULL AND $entry_utm_source != ''
    GROUP BY source, medium, campaign
    ORDER BY sessions DESC
    LIMIT 10`
  );
  return rows.map(([source, medium, campaign, sessions]) => ({
    source: text(source, '(none)'),
    medium: medium || null,
    campaign: campaign || null,
    sessions: num(sessions)
  }));
}

async function loadCountries(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string | null, string | null, number]>(
    config,
    'admin: countries',
    `SELECT
      properties.$geoip_country_code AS code,
      any(properties.$geoip_country_name) AS name,
      uniq($session_id) AS sessions
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}
    GROUP BY code
    ORDER BY sessions DESC
    LIMIT 12`
  );
  return rows.map(([code, name, sessions]) => ({
    label: code ? text(name, code) : 'Unknown',
    value: num(sessions)
  }));
}

async function loadTechnology(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const where = `event = '$pageview' AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}`;
  const rows = await runHogQL<[string, string | null, number]>(
    config,
    'admin: technology',
    `SELECT 'device' AS dimension, properties.$device_type AS value, uniq($session_id) AS sessions
      FROM events WHERE ${where} GROUP BY value
    UNION ALL
    SELECT 'browser' AS dimension, properties.$browser AS value, uniq($session_id) AS sessions
      FROM events WHERE ${where} GROUP BY value
    UNION ALL
    SELECT 'os' AS dimension, properties.$os AS value, uniq($session_id) AS sessions
      FROM events WHERE ${where} GROUP BY value`
  );

  const pick = (dimension: string) =>
    rows
      .filter((row) => row[0] === dimension)
      .map(([, value, sessions]) => ({label: text(value, 'Unknown'), value: num(sessions)}))
      .sort((a, z) => z.value - a.value)
      .slice(0, 8);
  return {devices: pick('device'), browsers: pick('browser'), os: pick('os')};
}

async function loadActions(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string, string | null, number, number]>(
    config,
    'admin: key actions',
    `SELECT
      event,
      multiIf(
        event = 'contact_link_clicked', properties.channel,
        event = 'project_gallery_opened', properties.project,
        event = 'featured_project_clicked', properties.project,
        event = 'certification_verified', properties.link,
        event = 'project_link_clicked', concat(properties.project, ' · ', properties.link),
        event = 'contact_cta_clicked', properties.placement,
        NULL
      ) AS detail,
      count() AS total,
      uniq($session_id) AS sessions
    FROM events
    WHERE event IN (${ACTION_EVENTS_SQL})
      AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}
    GROUP BY event, detail
    ORDER BY total DESC
    LIMIT 100`
  );

  const byEvent = new Map<AnalyticsEvent, ActionRow>();
  for (const [event, detail, total, sessions] of rows) {
    if (!isAnalyticsEvent(event)) continue;
    const row = byEvent.get(event) ?? {event, total: 0, sessions: 0, details: []};
    row.total += num(total);
    // Sessions are summed per detail, so this is an upper bound when one
    // session did the same action on several items.
    row.sessions += num(sessions);
    if (detail) row.details.push({label: detail, value: num(total)});
    byEvent.set(event, row);
  }
  return [...byEvent.values()].sort((a, z) => z.total - a.total);
}

async function loadFlows(config: PostHogQueryConfig, range: DashboardRange) {
  const b = bounds(range);
  const rows = await runHogQL<[string, string, number]>(
    config,
    'admin: navigation flows',
    `SELECT
      properties.$prev_pageview_pathname AS from_path,
      properties.$pathname AS to_path,
      count() AS transitions
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= ${b.currentFrom} AND timestamp < ${b.currentTo}
      AND properties.$prev_pageview_pathname IS NOT NULL
      AND properties.$prev_pageview_pathname != properties.$pathname
    GROUP BY from_path, to_path
    ORDER BY transitions DESC
    LIMIT 10`
  );
  return rows.map(([from, to, count]) => ({
    from: text(from, '(unknown)'),
    to: text(to, '(unknown)'),
    count: num(count)
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

  const [overview, trend, pages, sources, channels, utm, countries, technology, actions, flows] =
    await Promise.all([
      settle(() => loadOverview(config, range)),
      settle(() => loadTrend(config, range)),
      settle(() => loadPages(config, range)),
      settle(() => loadSources(config, range)),
      settle(() => loadChannels(config, range)),
      settle(() => loadUtm(config, range)),
      settle(() => loadCountries(config, range)),
      settle(() => loadTechnology(config, range)),
      settle(() => loadActions(config, range)),
      settle(() => loadFlows(config, range))
    ]);

  return {overview, trend, pages, sources, channels, utm, countries, technology, actions, flows};
}

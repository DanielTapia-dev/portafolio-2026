import {Suspense} from 'react';
import type {Metadata} from 'next';
import {BarChart3, Info, LogOut, PlugZap} from 'lucide-react';
import {logout} from '@/app/admin/actions';
import {requireAdmin} from '@/lib/admin/require-admin';
import {CACHE_SECONDS, getDashboardData} from '@/lib/analytics/dashboard';
import {formatCount} from '@/lib/analytics/format';
import {missingAnalyticsEnv} from '@/lib/analytics/posthog';
import {formatPeriod, resolveRange, todayIn, type DashboardRange} from '@/lib/analytics/range';
import PeriodFilter from './_components/period-filter';
import DashboardSkeleton from './_components/skeleton';
import TrafficChart from './_components/traffic-chart';
import {BarList, Card, KpiTile, SectionBody, SectionError} from './_components/ui';

export const metadata: Metadata = {title: 'Analytics'};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// The header and filters render right away; the numbers stream in below, so a
// filter change shows a skeleton instead of a frozen page.
export default async function AnalyticsPage({searchParams}: PageProps) {
  await requireAdmin();

  const {range, error: rangeError} = resolveRange(await searchParams);
  const rangeKey = `${range.current.from}:${range.current.to}:${range.granularity}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Header range={range} />
      <PeriodFilter range={range} today={todayIn(range.timeZone)} />
      {rangeError && <SectionError message={`${rangeError} Showing the last 30 days instead.`} />}

      <Suspense key={rangeKey} fallback={<DashboardSkeleton />}>
        <DashboardContent range={range} />
      </Suspense>

      <Glossary />
    </div>
  );
}

function Header({range}: {range: DashboardRange}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <BarChart3 size={14} />
          Portfolio analytics
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {formatPeriod(range.current)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {range.days} {range.days === 1 ? 'day' : 'days'}, compared with{' '}
          {formatPeriod(range.previous)} · Time zone: {range.timeZone}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </form>
    </header>
  );
}

async function DashboardContent({range}: {range: DashboardRange}) {
  const missing = missingAnalyticsEnv();
  const data = await getDashboardData(range);
  if (!data) return <SetupNotice missing={missing} />;

  const {traffic} = data;
  if (!traffic.ok) return <SectionError message={traffic.error} />;

  const {current, previous, trend} = traffic.data;
  const trackingOff = missing.includes('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN') && (
    <SectionError message="Tracking is off on this deployment: NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set, so no new visits are being recorded." />
  );

  if (current.pageviews === 0 && previous.pageviews === 0) {
    return (
      <div className="space-y-6">
        {trackingOff}
        <Card title="No visits recorded for this period">
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>PostHog is connected, but it has no page views between these dates.</p>
            <p>Visits are only recorded from the moment tracking was deployed; PostHog cannot recover traffic from before that. Your own visits are excluded once you sign in here, and visitors with Do Not Track or an ad blocker are not counted.</p>
          </div>
        </Card>
      </div>
    );
  }

  const pagesPerVisit = current.visits ? current.pageviews / current.visits : null;
  const previousPagesPerVisit = previous.visits ? previous.pageviews / previous.visits : null;

  return (
    <div className="space-y-6">
      {trackingOff}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <KpiTile
          label="Visits"
          value={formatCount(current.visits)}
          current={current.visits}
          previous={previous.visits}
          hint="Sessions on the site. Not unique people: see the notes below."
        />
        <KpiTile
          label="Page views"
          value={formatCount(current.pageviews)}
          current={current.pageviews}
          previous={previous.pageviews}
          hint="Every page loaded, including in-app navigation."
        />
        <KpiTile
          label="Pages per visit"
          value={pagesPerVisit === null ? '—' : pagesPerVisit.toFixed(1)}
          current={pagesPerVisit}
          previous={previousPagesPerVisit}
          hint="How far visitors browse in one visit."
        />
      </div>

      <Card title="Visits over time" description="The previous period is lined up bucket by bucket with the selected one.">
        <TrafficChart points={trend} granularity={range.granularity} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Most visited pages">
          <SectionBody section={data.pages} isEmpty={(rows) => rows.length === 0} empty="No page views in this period.">
            {(rows) => (
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="pb-2 font-medium">Page</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pl-3 text-right font-medium">Views</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pl-3 text-right font-medium">Visits</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {rows.map((row) => (
                    <tr key={row.path} className="border-t border-border">
                      <td className="py-2 font-mono text-xs break-all text-foreground">{row.path}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right">{formatCount(row.views)}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right text-muted-foreground">{formatCount(row.visits)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionBody>
        </Card>

        <Card className="lg:col-span-2" title="Where visitors are" description="Approximate, from the IP address at ingestion. The IP itself is not stored.">
          <SectionBody section={data.geography} isEmpty={(d) => d.countries.length === 0} empty="No location data in this period.">
            {(d) => (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Countries</h3>
                  <BarList rows={d.countries} unit="visits" />
                </div>
                {d.regions.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regions</h3>
                    <BarList rows={d.regions} unit="visits" />
                  </div>
                )}
              </div>
            )}
          </SectionBody>
        </Card>
      </div>
    </div>
  );
}

function SetupNotice({missing}: {missing: string[]}) {
  return (
    <Card title="Connect PostHog to see your analytics">
      <div className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
        <PlugZap size={20} className="mt-0.5 shrink-0 text-primary" />
        <div className="space-y-2">
          <p>The dashboard reads its numbers from PostHog, which is not configured yet. Set these environment variables in Vercel and redeploy:</p>
          <ul className="list-inside list-disc font-mono text-xs text-foreground">
            {(missing.length ? missing : ['POSTHOG_PROJECT_ID (digits only)']).map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p>README › Analytics explains where to find each value. No data is shown until then, and nothing is simulated.</p>
        </div>
      </div>
    </Card>
  );
}

const GLOSSARY: [string, string][] = [
  ['Visits', 'Sessions: page views from one browser tab until 30 minutes of inactivity. Because nothing is stored in the visitor’s browser, a reload or a new tab starts a new visit, so this is not a count of unique people.'],
  ['Page views', 'Each page loaded or reached through in-app navigation. Reloads count again.'],
  ['Countries and regions', 'Approximate location from the visitor’s IP address, looked up by PostHog when the event arrives. Regions are states or provinces and are missing when the lookup cannot tell.'],
  ['Freshness', `Numbers are cached for up to ${CACHE_SECONDS / 60} minutes, so a period you just viewed opens instantly. New visits can take a few minutes to appear.`],
  ['Coverage', 'Estimates, not exact counts: visitors who block PostHog, send Do Not Track or disable JavaScript are not recorded, and your own browser is excluded after you sign in here. Clicks on contact links and projects are still recorded and can be explored in PostHog itself.']
];

function Glossary() {
  return (
    <Card title="How to read these numbers">
      <div className="flex gap-3">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <dl className="grid flex-1 gap-x-8 gap-y-3 text-sm md:grid-cols-2">
          {GLOSSARY.map(([term, definition]) => (
            <div key={term}>
              <dt className="font-medium text-foreground">{term}</dt>
              <dd className="mt-0.5 leading-relaxed text-muted-foreground">{definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}

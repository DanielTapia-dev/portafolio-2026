import type {Metadata} from 'next';
import {ArrowRight, BarChart3, Info, LogOut, PlugZap} from 'lucide-react';
import {logout} from '@/app/admin/actions';
import {requireAdmin} from '@/lib/admin/require-admin';
import {getDashboardData, type DashboardData} from '@/lib/analytics/dashboard';
import {ANALYTICS_EVENT_LABELS} from '@/lib/analytics/events';
import {formatCount, formatDuration, formatPercent} from '@/lib/analytics/format';
import {missingAnalyticsEnv} from '@/lib/analytics/posthog';
import {formatPeriod, resolveRange, todayIn, type DashboardRange} from '@/lib/analytics/range';
import PeriodFilter from './_components/period-filter';
import TrafficChart from './_components/traffic-chart';
import {BarList, Card, KpiTile, SectionBody, SectionError} from './_components/ui';

export const metadata: Metadata = {title: 'Analytics'};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({searchParams}: PageProps) {
  await requireAdmin();

  const {range, error: rangeError} = resolveRange(await searchParams);
  const missing = missingAnalyticsEnv();
  const data = await getDashboardData(range);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Header range={range} />
      <PeriodFilter range={range} today={todayIn(range.timeZone)} />
      {rangeError && <SectionError message={`${rangeError} Showing the last 30 days instead.`} />}

      {!data ? (
        <SetupNotice missing={missing} />
      ) : (
        <>
          {missing.includes('NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN') && (
            <SectionError message="Tracking is off on this deployment: NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set, so no new visits are being recorded." />
          )}
          <Dashboard data={data} range={range} />
        </>
      )}

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

function Dashboard({data, range}: {data: DashboardData; range: DashboardRange}) {
  const {overview} = data;
  if (!overview.ok) return <SectionError message={overview.error} />;

  const {current, previous} = overview.data;
  if (current.pageviews === 0 && previous.pageviews === 0) {
    return (
      <Card title="No visits recorded for this period">
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>PostHog is connected, but it has no page views between these dates.</p>
          <p>Visits are only recorded from the moment tracking was deployed; PostHog cannot recover traffic from before that. Your own visits are excluded once you sign in here, and visitors with Do Not Track or an ad blocker are not counted.</p>
        </div>
      </Card>
    );
  }

  const actionShare = current.sessions ? current.sessionsWithAction / current.sessions : null;
  const previousActionShare = previous.sessions ? previous.sessionsWithAction / previous.sessions : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <KpiTile
          label="Page views"
          value={formatCount(current.pageviews)}
          current={current.pageviews}
          previous={previous.pageviews}
          hint="Every page loaded, including client-side navigation."
        />
        <KpiTile
          label="Sessions"
          value={formatCount(current.sessions)}
          current={current.sessions}
          previous={previous.sessions}
          hint="Visits. Not unique people: see the notes below."
        />
        <KpiTile
          label="Avg. session duration"
          value={formatDuration(current.avgSessionSeconds)}
          current={current.avgSessionSeconds}
          previous={previous.avgSessionSeconds}
          hint="First to last event in a session."
        />
        <KpiTile
          label="Bounce rate"
          value={current.bounceRate === null ? '—' : formatPercent(current.bounceRate)}
          current={current.bounceRate}
          previous={previous.bounceRate}
          upIsGood={false}
          hint="One page and under 10 seconds."
        />
        <KpiTile
          label="Sessions with a key action"
          value={actionShare === null ? '—' : formatPercent(actionShare)}
          current={actionShare}
          previous={previousActionShare}
          hint={`${formatCount(current.sessionsWithAction)} sessions contacted you or opened a project.`}
        />
      </div>

      <Card title="Traffic over time" description="The previous period is lined up bucket by bucket with the selected one.">
        <SectionBody section={data.trend} isEmpty={(points) => points.length === 0} empty="No traffic in this period.">
          {(points) => <TrafficChart points={points} granularity={range.granularity} />}
        </SectionBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Top pages" description="Median time on page comes from the next page view or the page leave, so the last page of a closed tab may be missing.">
          <SectionBody section={data.pages} isEmpty={(rows) => rows.length === 0} empty="No page views in this period.">
            {(rows) => (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="pb-2 font-medium">Page</th>
                      <th scope="col" className="whitespace-nowrap pb-2 pl-3 text-right font-medium">Views</th>
                      <th scope="col" className="whitespace-nowrap pb-2 pl-3 text-right font-medium">Sessions</th>
                      <th scope="col" className="whitespace-nowrap pb-2 pl-3 text-right font-medium">
                        <span className="sm:hidden">Median</span>
                        <span className="hidden sm:inline">Median time</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {rows.map((row) => (
                      <tr key={row.path} className="border-t border-border">
                        <td className="py-2 font-mono text-xs break-all text-foreground">{row.path}</td>
                        <td className="whitespace-nowrap py-2 pl-3 text-right">{formatCount(row.views)}</td>
                        <td className="whitespace-nowrap py-2 pl-3 text-right text-muted-foreground">{formatCount(row.sessions)}</td>
                        <td className="whitespace-nowrap py-2 pl-3 text-right text-muted-foreground">{formatDuration(row.medianSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionBody>
        </Card>

        <Card className="lg:col-span-2" title="Key actions" description="Signals of interest in your profile. A session counts once per item.">
          <SectionBody section={data.actions} isEmpty={(rows) => rows.length === 0} empty="No contact clicks, project opens or messages yet.">
            {(rows) => (
              <ul className="space-y-4">
                {rows.map((row) => (
                  <li key={row.event} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-foreground">{ANALYTICS_EVENT_LABELS[row.event]}</span>
                      <span className="shrink-0 tabular-nums text-foreground">{formatCount(row.total)}</span>
                    </div>
                    {row.details.length > 0 && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {row.details.map((d) => `${d.label} ${formatCount(d.value)}`).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionBody>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Sources" description="Where sessions came from, grouped by site. Sessions per source.">
          <SectionBody section={data.sources} isEmpty={(d) => d.sources.length === 0} empty="No sessions in this period.">
            {(d) => <BarList rows={d.sources.slice(0, 8)} unit="sessions" />}
          </SectionBody>
        </Card>
        <Card title="Channels" description="PostHog’s channel type for each session.">
          <SectionBody section={data.channels} isEmpty={(rows) => rows.length === 0} empty="No sessions in this period.">
            {(rows) => <BarList rows={rows} unit="sessions" />}
          </SectionBody>
        </Card>
        <Card title="Referring domains" description="Exact domains, when the browser sent a referrer.">
          <SectionBody section={data.sources} isEmpty={(d) => d.referrers.length === 0} empty="No referrers in this period. Many apps and browsers hide them.">
            {(d) => <BarList rows={d.referrers} unit="sessions" />}
          </SectionBody>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Countries" description="Approximate, from the IP address at ingestion. The IP itself is not stored.">
          <SectionBody section={data.countries} isEmpty={(rows) => rows.length === 0} empty="No location data in this period.">
            {(rows) => <BarList rows={rows} unit="sessions" />}
          </SectionBody>
        </Card>
        <Card title="Campaigns (UTM)" description="Sessions that arrived through a link with utm_source.">
          <SectionBody section={data.utm} isEmpty={(rows) => rows.length === 0} empty="No UTM-tagged visits. Add ?utm_source=linkedin&utm_campaign=… to links you share.">
            {(rows) => (
              <ul className="space-y-2 text-sm">
                {rows.map((row) => (
                  <li key={`${row.source}|${row.medium}|${row.campaign}`} className="flex items-baseline justify-between gap-3 border-t border-border pt-2 first:border-0 first:pt-0">
                    <span className="min-w-0 truncate text-foreground">
                      {row.source}
                      <span className="text-muted-foreground">
                        {row.medium ? ` / ${row.medium}` : ''}
                        {row.campaign ? ` · ${row.campaign}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatCount(row.sessions)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionBody>
        </Card>
      </div>

      <Card title="Devices, browsers and operating systems" description="Sessions per value, from the browser’s user agent.">
        <SectionBody section={data.technology} isEmpty={(d) => d.devices.length === 0} empty="No device data in this period.">
          {(d) => (
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {title: 'Device', rows: d.devices},
                {title: 'Browser', rows: d.browsers},
                {title: 'Operating system', rows: d.os}
              ].map(({title, rows}) => (
                <div key={title}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
                  <BarList rows={rows} unit="sessions" />
                </div>
              ))}
            </div>
          )}
        </SectionBody>
      </Card>

      <Card title="Navigation paths" description="Most common moves from one page to the next within a visit.">
        <SectionBody section={data.flows} isEmpty={(rows) => rows.length === 0} empty="No multi-page visits in this period.">
          {(rows) => (
            <ul className="divide-y divide-border text-sm">
              {rows.map((row) => (
                <li key={`${row.from}→${row.to}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 font-mono text-xs">
                    <span className="truncate text-muted-foreground" title={row.from}>{row.from}</span>
                    <ArrowRight size={14} aria-label="to" className="shrink-0 text-primary" />
                    <span className="truncate text-foreground" title={row.to}>{row.to}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCount(row.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionBody>
      </Card>
    </div>
  );
}

const GLOSSARY: [string, string][] = [
  ['Page views', 'Each page loaded or reached through in-app navigation. Reloads count again.'],
  ['Sessions', 'A visit: page views from one browser tab until 30 minutes of inactivity. Because nothing is stored in the visitor’s browser, opening the site in a new tab or reloading starts a new session.'],
  ['Unique visitors', 'Not shown. Counting unique people needs a cookie or browser storage, which this site deliberately does not use, so any “unique visitors” figure would be a guess.'],
  ['Avg. session duration', 'Time between the first and the last event of a session, including the page leave. Single-page visits closed without a page leave count as 0 seconds.'],
  ['Bounce rate', 'Share of sessions with one page view, no other interaction and under 10 seconds (PostHog’s definition; the threshold can be changed in its web analytics settings).'],
  ['Key actions', 'Clicks on “Contact me”, contact links (GitHub, LinkedIn, X, email), copying the email, sending the contact form, opening a project gallery, opening a project’s code or live site, opening a featured project from About, and checking a certification on Credly.'],
  ['Coverage', 'Estimates, not exact counts: visitors who block PostHog, send Do Not Track or disable JavaScript are not recorded, and your own browser is excluded after you sign in here.']
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

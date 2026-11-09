import 'server-only';

// Server-side access to the PostHog Query API. The personal API key never
// leaves the server: it is read here and only sent to PostHog.
// Docs: https://posthog.com/docs/api/queries

export type PostHogQueryConfig = {
  appHost: string;
  projectId: string;
  apiKey: string;
};

export class AnalyticsQueryError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'AnalyticsQueryError';
  }
}

// The ingestion host (us.i.posthog.com) maps to the app host (us.posthog.com).
function appHostFromIngestHost(ingestHost: string | undefined) {
  if (!ingestHost) return 'https://us.posthog.com';
  try {
    const url = new URL(ingestHost);
    if (url.hostname === 'eu.i.posthog.com') return 'https://eu.posthog.com';
    if (url.hostname === 'us.i.posthog.com') return 'https://us.posthog.com';
    return url.origin;
  } catch {
    return 'https://us.posthog.com';
  }
}

export const REQUIRED_ENV = [
  'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN',
  'POSTHOG_PROJECT_ID',
  'POSTHOG_PERSONAL_API_KEY'
] as const;

export const missingAnalyticsEnv = () =>
  REQUIRED_ENV.filter((name) => !process.env[name]);

export function getPostHogQueryConfig(): PostHogQueryConfig | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId || !/^\d+$/.test(projectId)) return null;

  return {
    apiKey,
    projectId,
    appHost:
      process.env.POSTHOG_API_HOST ??
      appHostFromIngestHost(process.env.NEXT_PUBLIC_POSTHOG_HOST)
  };
}

function describeStatus(status: number) {
  if (status === 401 || status === 403) {
    return 'PostHog rejected the API key. Check that POSTHOG_PERSONAL_API_KEY is valid, has the “Query Read” scope and can access this project.';
  }
  if (status === 404) {
    return 'PostHog could not find the project. Check POSTHOG_PROJECT_ID and the region in NEXT_PUBLIC_POSTHOG_HOST.';
  }
  if (status === 429) {
    return 'PostHog’s query rate limit was reached. Wait a minute and reload.';
  }
  if (status >= 500) return 'PostHog is not responding right now. Try again shortly.';
  return `PostHog returned an error (HTTP ${status}).`;
}

// PostHog allows 3 concurrent queries per project, so queries wait their turn.
const MAX_CONCURRENT = 3;
let running = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

// Runs a HogQL query and returns its rows. Every value interpolated into
// `query` must come from validated server-side data, never from raw input.
export function runHogQL<Row extends unknown[]>(
  config: PostHogQueryConfig,
  name: string,
  query: string
): Promise<Row[]> {
  return withSlot(async () => {
    let response: Response;
    try {
      response = await fetch(
        `${config.appHost}/api/projects/${config.projectId}/query/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({query: {kind: 'HogQLQuery', query}, name}),
          cache: 'no-store',
          signal: AbortSignal.timeout(30_000)
        }
      );
    } catch {
      throw new AnalyticsQueryError('Could not reach PostHog. Try again shortly.');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(
        `[analytics] ${name} failed with HTTP ${response.status}: ${body.slice(0, 300)}`
      );
      throw new AnalyticsQueryError(describeStatus(response.status), response.status);
    }

    const json = (await response.json()) as {results?: Row[]};
    return json.results ?? [];
  });
}

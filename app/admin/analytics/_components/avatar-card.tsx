import {readAvatarConfig} from '@/lib/avatar/config';
import {getAvatarRedis} from '@/lib/avatar/redis';
import {averageCostMicroUsd, getMode, readMonthStats} from '@/lib/avatar/budget';
import {formatCount} from '@/lib/analytics/format';
import {Card, SectionError} from './ui';

const usd = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
const toUsd = (microUsd: number) => usd.format(microUsd / 1_000_000);

const DESCRIPTION =
  'Counters for the current UTC month. No conversation content is stored, only totals.';

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
    </div>
  );
}

// Reads the Redis counters directly, so it works without PostHog configured.
export default async function AvatarCard() {
  const config = readAvatarConfig();
  const redis = getAvatarRedis(config);

  if (!config || !redis) {
    return (
      <Card title="Avatar · this month" description={DESCRIPTION}>
        <p className="text-sm text-muted-foreground">
          Not configured: set ANTHROPIC_API_KEY, the Upstash Redis variables and AVATAR_SIGNING_SECRET.
        </p>
      </Card>
    );
  }

  const now = new Date();
  let stats;
  try {
    stats = await readMonthStats(redis, now);
  } catch {
    // Generic on purpose: the error could carry connection details.
    return (
      <Card title="Avatar · this month" description={DESCRIPTION}>
        <SectionError message="Could not read the avatar counters from Redis." />
      </Card>
    );
  }

  const average = averageCostMicroUsd(stats);
  const mode = await getMode(redis, config, now);

  return (
    <Card title="Avatar · this month" description={DESCRIPTION}>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Spend" value={toUsd(stats.spendMicroUsd)} />
        <Stat label="Conversations" value={formatCount(stats.conversations)} />
        <Stat label="Questions" value={formatCount(stats.questions)} />
        <Stat label="Avg. per conversation" value={average === null ? '—' : toUsd(average)} />
        <Stat label="Mode" value={mode} />
      </dl>
    </Card>
  );
}

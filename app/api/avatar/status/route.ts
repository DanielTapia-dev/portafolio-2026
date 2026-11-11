import {getMode} from '@/lib/avatar/budget';
import {readAvatarConfig} from '@/lib/avatar/config';
import {getAvatarRedis} from '@/lib/avatar/redis';

// Read at request time so the mode never gets frozen into the build.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = readAvatarConfig();
  const mode = await getMode(getAvatarRedis(config), config, new Date());
  return Response.json(
    {mode},
    {headers: {'Cache-Control': 'public, s-maxage=30'}}
  );
}

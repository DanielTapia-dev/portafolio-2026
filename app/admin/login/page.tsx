import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {LockKeyhole} from 'lucide-react';
import {isLoginConfigured} from '@/lib/admin/credentials';
import {ADMIN_HOME, isAdmin, safeAdminPath} from '@/lib/admin/require-admin';
import LoginForm from './login-form';

export const metadata: Metadata = {title: 'Sign in'};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAdmin()) redirect(ADMIN_HOME);

  const {next} = await searchParams;
  const isConfigured = isLoginConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <LockKeyhole size={20} className="text-primary" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Portfolio admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Private analytics dashboard
            </p>
          </div>
        </div>

        {isConfigured ? (
          <LoginForm next={safeAdminPath(Array.isArray(next) ? next[0] : next)} />
        ) : (
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">
              Sign-in is not configured.
            </p>
            <p>
              Set <code className="font-mono text-xs">ADMIN_USERNAME</code> and{' '}
              <code className="font-mono text-xs">ADMIN_PASSWORD</code> in the
              project’s environment variables on Vercel, then redeploy.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import {useActionState} from 'react';
import {Loader2, LogIn} from 'lucide-react';
import {login, type LoginState} from '../actions';

export default function LoginForm({next}: {next: string}) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoFocus
          autoComplete="username"
          defaultValue={state.username}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={256}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'login-error' : undefined}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={256}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? 'login-error' : undefined}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <LogIn size={18} />
        )}
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

# Daniel Tapia — Portfolio

Personal portfolio of Daniel Tapia, Full Stack Developer. It presents my experience, featured projects with screenshot galleries, and a contact form, in English and Spanish.

**Live site:** https://daniel-portfolio-v2-lovat.vercel.app

## Features

- **English and Spanish.** English is served at `/` and Spanish at `/es`. Browsers set to Spanish are sent to `/es` on their first visit, and the header switch remembers the choice.
- **Project galleries.** Each featured project opens a modal gallery of its screenshots, with keyboard navigation (Esc, ← and →).
- **Contact form.** Messages are emailed through [Resend](https://resend.com).
- **Static rendering.** Every page is prerendered for both languages.
- **Private analytics dashboard.** `/admin/analytics`, behind a sign-in, shows traffic, sources, pages and key actions from [PostHog](https://posthog.com). See [Analytics](#analytics).

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- [next-intl](https://next-intl.dev) for routing and translations
- [Tailwind CSS 4](https://tailwindcss.com) and [lucide-react](https://lucide.dev) icons
- [Resend](https://resend.com) for email
- [PostHog](https://posthog.com) (`posthog-js`) for privacy-first visitor analytics
- Deployed on [Vercel](https://vercel.com), with Vercel Analytics

## Getting started

Requires Node.js 20.9 or later.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The contact form also needs the environment variables below; every other page works without them.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Address that receives contact messages |
| `CONTACT_FROM_EMAIL` | Sender address, on a domain verified in Resend |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project token (`phc_…`). Public: it only allows sending events. Without it, nothing is tracked |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` or `https://eu.i.posthog.com`, matching your PostHog region |
| `POSTHOG_PROJECT_ID` | Numeric project ID, used by the dashboard. Server only |
| `POSTHOG_PERSONAL_API_KEY` | Personal API key with the **Query Read** scope, limited to this project. Server only |
| `ANALYTICS_TIME_ZONE` | Optional IANA time zone for the dashboard's days, such as `America/Guayaquil`. Defaults to UTC |
| `ADMIN_USERNAME` | Username for `/admin` |
| `ADMIN_PASSWORD` | Password for `/admin`. Use a long one: the sign-in is the only thing protecting your analytics |
| `ADMIN_SESSION_SECRET` | Optional, 32+ random characters to sign admin sessions. Without it, sessions are signed with the credentials, so changing the password signs everyone out |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
app/
  [locale]/            Pages, rendered once per language
    page.tsx           Home
    (general)/         About, Projects and Contact
  admin/               Private area: its own root layout, sign-in and analytics dashboard
  api/contact/         Contact form endpoint (Resend)
  components/          Header, ProjectGallery, ProfileAvatar, SocialNetworks
i18n/                  next-intl routing, navigation and request config
messages/              en.json (source of truth) and es.json
lib/
  projects.ts          Project data: slug, images, tech stack and links
  admin/               Sign-in credentials, session tokens and the admin guard
  analytics/           Event catalog, PostHog queries, date ranges and formatting
public/projects/       Screenshots, one folder per project
instrumentation-client.ts  PostHog setup and click tracking in the browser
proxy.ts               Locale detection, redirects and the /admin gate
```

## Adding a project

1. Put its screenshots in `public/projects/<slug>/`, with descriptive file names.
2. Add an entry to `lib/projects.ts` with the slug, `images: screenshots('<slug>', [...])`, tech stack and links. The first image is the cover; it fills a 2:1 frame from the top, so any shape works. Inside the gallery, every image keeps its own proportions.
3. Add its title and description under `Projects.items.<slug>` in both `messages/en.json` and `messages/es.json`. Featured projects can also have a `role` line and a `highlights` list of what you worked on.

TypeScript checks that every slug has a translation, because message keys are typed from `messages/en.json`.

> This repository is public. Before committing a screenshot, blur any personal or client data: names, ID numbers, emails, phone numbers, addresses, account numbers and access keys.

## Analytics

Visits are recorded with [PostHog](https://posthog.com) and read back on a private dashboard at `/admin/analytics`. Vercel Web Analytics stays installed, but on the Hobby plan it keeps one month of data and has no custom events, so it cannot answer which visitors contacted me or opened a project.

### What is recorded

- **Page views** on first load and on every client-side navigation, plus a **page leave**, which gives time on page and session duration.
- **Key actions:** the home "Contact me" button, contact links (GitHub, LinkedIn, X, email), copying the email, sending the contact form (never its contents), opening a project gallery, opening a project's code or live site, opening a featured project card on About, and checking a certification on Credly. The catalog is in `lib/analytics/events.ts`; to track a click, spread `analyticsAttributes('<event>', {...})` on the element.
- **Context from PostHog:** approximate country, referring domain, UTM parameters, device, browser and OS.

### Privacy choices

- No cookies, localStorage or sessionStorage on visitors' browsers (`persistence: 'memory'`), so no cookie banner is needed. The trade-off: unique visitors cannot be counted, and a reload or new tab starts a new session.
- No person profiles, session recording, autocapture, heatmaps or surveys. Browsers that send Do Not Track are not tracked, and PostHog drops traffic that looks like bots.
- URLs keep only their path and `utm_*` parameters, referrers keep only their origin, and ad click IDs (`gclid`, `fbclid`…) are removed before sending.
- `/admin` is never tracked. After signing in, a `pf_internal` cookie on your own browser stops tracking your visits to the site.

### Setup

1. Create a PostHog Cloud project and note its region (US or EU).
2. In PostHog, open **Settings › Project** and turn on **Discard client IP data**. Country lookup still runs at ingestion, but the IP is not stored.
3. Copy the **project token** and **project ID** from the project settings.
4. Create a **personal API key** with only the **Query Read** scope, limited to this project.
5. In Vercel, add the variables from the table above for Production (and Preview if you want it there), then redeploy.
6. Open `/admin/login` and sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

Data starts on the day the token is deployed. PostHog cannot recover visits from before that.

### Security

- `/admin/*` is checked twice: in `proxy.ts`, and again in each page and in the function that queries PostHog.
- The session is an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie that expires after 8 hours.
- Every sign-in attempt takes at least 0.8 s, which slows down password guessing. There is no lockout, so use a long password.
- The PostHog personal API key is only used on the server; the browser never receives it, and there is no public API route that returns analytics.

### Limits

- **PostHog free plan:** 1 million events a month, with data kept for 1 year. Check the [pricing page](https://posthog.com/pricing) for current terms.
- **Query API:** at most 3 queries run at the same time per project, and there is an hourly limit. One dashboard load runs 12 small queries, three at a time.
- **Ad blockers:** some block PostHog's domain, so those visits are missing. To recover most of them, PostHog suggests [proxying requests through your own domain](https://posthog.com/docs/advanced/proxy/nextjs). That was left out here because proxied requests could report the server's location instead of the visitor's, which would need testing first.

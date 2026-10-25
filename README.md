# Daniel Tapia — Portfolio

Personal portfolio of Daniel Tapia, Full Stack Developer. It presents my experience, featured projects with screenshot galleries, and a contact form, in English and Spanish.

**Live site:** https://daniel-portfolio-v2-lovat.vercel.app

## Features

- **English and Spanish.** English is served at `/` and Spanish at `/es`. Browsers set to Spanish are sent to `/es` on their first visit, and the header switch remembers the choice.
- **Project galleries.** Each featured project opens a modal gallery of its screenshots, with keyboard navigation (Esc, ← and →).
- **Contact form.** Messages are emailed through [Resend](https://resend.com).
- **Static rendering.** Every page is prerendered for both languages.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- [next-intl](https://next-intl.dev) for routing and translations
- [Tailwind CSS 4](https://tailwindcss.com) and [lucide-react](https://lucide.dev) icons
- [Resend](https://resend.com) for email
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
  api/contact/         Contact form endpoint (Resend)
  components/          Header, ProjectGallery, ProfileAvatar, SocialNetworks
i18n/                  next-intl routing, navigation and request config
messages/              en.json (source of truth) and es.json
lib/projects.ts        Project data: slug, images, tech stack and links
public/projects/       Screenshots, one folder per project
proxy.ts               Locale detection and redirects
```

## Adding a project

1. Put its screenshots in `public/projects/<slug>/`, with descriptive file names.
2. Add an entry to `lib/projects.ts` with the slug, `images: screenshots('<slug>', [...])`, tech stack and links. The first image is the cover; it fills a 2:1 frame from the top, so any shape works. Inside the gallery, every image keeps its own proportions.
3. Add its title and description under `Projects.items.<slug>` in both `messages/en.json` and `messages/es.json`.

TypeScript checks that every slug has a translation, because message keys are typed from `messages/en.json`.

> This repository is public. Before committing a screenshot, blur any personal or client data: names, ID numbers, emails, phone numbers, addresses, account numbers and access keys.

import {existsSync} from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Cloud,
  Database,
  ExternalLink,
  LayoutTemplate,
  MapPin,
  Network,
  Server,
  UserRound,
  Users
} from 'lucide-react';
import {
  getMessages,
  getTranslations,
  setRequestLocale
} from 'next-intl/server';
import type {Locale} from 'next-intl';
import ProfileAvatar from '@/app/components/ProfileAvatar';
import Reveal from '@/app/components/Reveal';
import SectionNav from '@/app/components/SectionNav';
import {SocialNetworks} from '@/app/components/SocialNetworks';
import {Link} from '@/i18n/navigation';
import {analyticsAttributes} from '@/lib/analytics/events';
import {projects, type ProjectSlug} from '@/lib/projects';
import {cn} from '@/lib/utils';

// Items live in messages under About.skills.<category>: `core` lists the skills
// backed by the experience and projects on this site, `also` the rest.
const skillCategories = [
  {category: 'frontend', icon: LayoutTemplate},
  {category: 'backend', icon: Server},
  {category: 'architecture', icon: Network},
  {category: 'data', icon: Database},
  {category: 'cloud', icon: Cloud},
  {category: 'practices', icon: Users}
] as const;

// Each card links to its project on /projects (the entry's id is its slug).
// Copy lives in messages under About.featured.items.<id>; the cover and the
// stack come from lib/projects.ts. FactuPro covers v1 and v2 in one card.
const featuredCards: {
  id: 'falabella' | 'armada' | 'hits' | 'factupro';
  slug: ProjectSlug;
  alsoFrom?: ProjectSlug;
}[] = [
  {id: 'falabella', slug: 'falabella-seller-center'},
  {id: 'armada', slug: 'armada-reserve'},
  {id: 'hits', slug: 'nih-hits'},
  {id: 'factupro', slug: 'factupro-v2', alsoFrom: 'factupro-v1'}
];

const MAX_CARD_TECHS = 6;

function cardDetails(slug: ProjectSlug, alsoFrom?: ProjectSlug) {
  const project = projects.find((p) => p.slug === slug);
  const extra = projects.find((p) => p.slug === alsoFrom);
  const techs = [...new Set([...(project?.techs ?? []), ...(extra?.techs ?? [])])];
  return {cover: project?.images?.[0], techs: techs.slice(0, MAX_CARD_TECHS)};
}

// Badge images are optional: drop the PNG exported from Credly at `badge`
// (under public/) and it replaces the generic icon at the next build.
const certifications: {
  title: string;
  issuer: string;
  code: string;
  year: string;
  credlyUrl: string;
  badge: string;
  trackingId: string;
}[] = [
  {
    title: 'AWS Certified Solutions Architect – Associate',
    issuer: 'AWS',
    code: 'SAA-C03',
    year: '2026',
    credlyUrl: 'https://www.credly.com/badges/90f04c41-bef3-4dca-8b81-6c9f546b2d93',
    badge: '/certifications/aws-solutions-architect-associate.png',
    trackingId: 'aws-solutions-architect-associate'
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    issuer: 'AWS',
    code: 'CLF-C02',
    year: '2025',
    credlyUrl: 'https://www.credly.com/badges/37db155a-683c-4195-babe-e6b773d740c9',
    badge: '/certifications/aws-cloud-practitioner.png',
    trackingId: 'aws-cloud-practitioner'
  }
];

// The About page is prerendered, so this runs at build time.
const hasBadgeImage = (badge: string) =>
  existsSync(path.join(process.cwd(), 'public', badge));

// Periods, titles, summaries and highlights live in messages under About.experience.<id>.
const experience = [
  // TODO(Daniel): team size, one or two concrete architecture decisions and any
  // documented outcome would make this entry stronger. Nothing is invented here.
  {
    id: 'falabella',
    isCurrent: true,
    company: 'SmartJob · Falabella',
    techs: [
      'React',
      'TypeScript',
      'Fastify',
      'BFF',
      'Microfrontends',
      'Design Systems',
      'i18n'
    ]
  },
  {
    id: 'stafi',
    company: 'Stafi 🇺🇸',
    techs: [
      'Next.js',
      'TypeScript',
      'NestJS',
      'Clerk',
      'PostgreSQL',
      'Vercel',
      'Microservices'
    ]
  },
  {
    id: 'freelance-fullstack',
    company: 'Freelance',
    techs: [
      'Node.js',
      'n8n',
      'WordPress',
      'AWS S3',
      'CloudFront',
      'GitHub Actions',
      'Redis',
      'MySQL'
    ],
    // A project delivered within this engagement, not a separate employer.
    project: {
      techs: [
        'Next.js',
        'NestJS',
        'TypeScript',
        'PostgreSQL',
        'Kafka',
        'Auth0',
        'Kubernetes',
        'Terraform',
        'Fireblocks',
        'Coinbase'
      ]
    }
  },
  {
    id: 'axle',
    company: 'MushroomSoft · Axle Informatics 🇺🇸',
    techs: [
      'Angular',
      'PrimeNG',
      'Microfrontends',
      '.NET 8',
      'PostgreSQL',
      'MongoDB',
      'Azure DevOps',
      'GitHub'
    ]
  },
  {
    id: 'zeyo',
    company: 'Zeyo · Business Blockchain',
    techs: [
      'Python',
      'JavaScript',
      'Angular',
      'React',
      'Node.js',
      'Blockchain',
      'AWS S3',
      'GitHub Actions',
      'Data Processing'
    ]
  },
  {
    id: 'kengisoft',
    company: 'Kengisoft',
    techs: ['Angular', 'Node.js', 'Spring Boot', 'WordPress', 'SQL']
  },
  {
    id: 'freelance-web',
    company: 'Freelance',
    techs: [
      'Java',
      'Spring Boot',
      'Angular',
      'Oracle',
      'WordPress',
      'Security Hardening'
    ]
  }
] as const;

type ExperienceCopy = {summary?: string; highlights: string[]};
type SkillCopy = {title: string; core: string[]; also: string[]};

const sections = [
  'bio',
  'featured',
  'experience',
  'skills',
  'certifications'
] as const;

function SectionTitle({children}: {children: React.ReactNode}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function BulletList({items}: {items: string[]}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="relative pl-4 text-sm leading-relaxed text-muted-foreground before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/60"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function AboutPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('About');
  // Arrays and optional fields are read from the messages directly.
  const messages = (await getMessages()).About;

  const stats = [
    {value: t('stats.experience.value'), label: t('stats.experience.label')},
    {value: String(projects.length), label: t('stats.projects.label')},
    {value: t('stats.certified.value'), label: t('stats.certified.label')}
  ];

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-16 max-w-3xl space-y-5 animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <UserRound size={14} />
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            {t('title')}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('subtitle')}
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20">
          <aside
            className="space-y-8 animate-fade-up lg:sticky lg:top-28 lg:h-fit"
            style={{animationDelay: '150ms'}}
          >
            <div className="rounded-2xl border border-border bg-card/60 p-6 text-center">
              <ProfileAvatar src="/Profile.jpg" alt={t('avatarAlt')} />
              <p className="mt-5 text-xl font-bold text-foreground">
                Daniel Tapia
              </p>
              <p className="mt-1 text-sm text-primary">{t('headline')}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={13} />
                {t('location')}
              </p>
              <div className="mt-5 flex justify-center border-t border-border pt-5">
                <SocialNetworks />
              </div>
            </div>

            <SectionNav
              label={t('navLabel')}
              sections={sections.map((id) => ({
                id,
                label: t(`sections.${id}`)
              }))}
            />
          </aside>

          <div className="min-w-0 space-y-24">
            <section id="bio" className="scroll-mt-28">
              <div className="space-y-5">
                <p className="text-lg leading-relaxed text-foreground">
                  {t('bio.intro')}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {t.rich('bio.current', {
                    highlight: (chunks) => (
                      <span className="font-medium text-foreground">
                        {chunks}
                      </span>
                    )
                  })}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {t('bio.stack')}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {t('bio.leadership')}
                </p>
              </div>

              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <Reveal
                    key={stat.label}
                    delay={index * 100}
                    className="flex flex-col rounded-xl border border-border bg-card/60 p-5"
                  >
                    <dt className="text-sm text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd className="order-first text-3xl font-bold tracking-tight text-primary">
                      {stat.value}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </section>

            <section id="featured" className="scroll-mt-28">
              <SectionTitle>{t('sections.featured')}</SectionTitle>
              <div className="grid gap-5 md:grid-cols-2">
                {featuredCards.map(({id, slug, alsoFrom}, index) => {
                  const {cover, techs} = cardDetails(slug, alsoFrom);

                  return (
                    <Reveal key={id} delay={(index % 2) * 100}>
                      <Link
                        href={`/projects#${slug}`}
                        {...analyticsAttributes('featured_project_clicked', {
                          project: slug
                        })}
                        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_50px_-25px_var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {cover && (
                          <span className="relative block aspect-2/1 overflow-hidden border-b border-border bg-secondary">
                            <Image
                              src={cover}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw"
                              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </span>
                        )}
                        <span className="flex flex-1 flex-col p-5">
                          <span className="font-mono text-xs text-primary">
                            {t(`featured.items.${id}.label`)}
                          </span>
                          <span className="mt-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {t(`featured.items.${id}.title`)}
                          </span>
                          <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {t(`featured.items.${id}.summary`)}
                          </span>
                          <span className="mt-4 flex flex-wrap gap-1.5">
                            {techs.map((tech) => (
                              <span
                                key={tech}
                                className="rounded-md border border-border bg-background/60 px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                {tech}
                              </span>
                            ))}
                          </span>
                          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-primary">
                            {t('featured.viewProject')}
                            <ArrowRight
                              size={16}
                              aria-hidden
                              className="transition-transform group-hover:translate-x-1"
                            />
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </section>

            <section id="experience" className="scroll-mt-28">
              <SectionTitle>{t('sections.experience')}</SectionTitle>
              <ol className="relative space-y-6 border-l border-border pl-8">
                {experience.map((exp) => {
                  const isCurrent = 'isCurrent' in exp && exp.isCurrent;
                  const copy = messages.experience[exp.id] as ExperienceCopy;

                  return (
                    <li key={exp.id} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          'absolute -left-[38.5px] top-6 h-3 w-3 rounded-full border-2',
                          isCurrent
                            ? 'border-primary bg-primary shadow-[0_0_12px_var(--primary)]'
                            : 'border-muted-foreground bg-background'
                        )}
                      />
                      <Reveal>
                        <div className="group rounded-xl border border-transparent p-5 transition-colors hover:border-border hover:bg-card/60">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-mono text-xs text-primary">
                              {t(`experience.${exp.id}.period`)}
                            </p>
                            {isCurrent && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                {t('current')}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                            {t(`experience.${exp.id}.title`)}{' '}
                            <span className="text-muted-foreground">
                              · {exp.company}
                            </span>
                          </h3>
                          {copy.summary && (
                            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                              {copy.summary}
                            </p>
                          )}
                          <div className="mt-3">
                            <BulletList items={copy.highlights} />
                          </div>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {exp.techs.map((tech) => (
                              <li
                                key={tech}
                                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                              >
                                {tech}
                              </li>
                            ))}
                          </ul>
                          {'project' in exp && (
                            <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('keyProject')}
                              </p>
                              <p className="mt-1 font-medium text-foreground">
                                {t(`experience.${exp.id}.project.name`)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {t(`experience.${exp.id}.project.client`)}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {t(`experience.${exp.id}.project.description`)}
                              </p>
                              <ul className="mt-3 flex flex-wrap gap-2">
                                {exp.project.techs.map((tech) => (
                                  <li
                                    key={tech}
                                    className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                                  >
                                    {tech}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section id="skills" className="scroll-mt-28">
              <SectionTitle>{t('skillsTitle')}</SectionTitle>
              <p className="-mt-4 mb-8 text-sm text-muted-foreground">
                {t('skillsIntro')}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                {skillCategories.map(({category, icon: Icon}, index) => {
                  const skill = messages.skills[category] as SkillCopy;

                  return (
                    <Reveal
                      key={category}
                      delay={(index % 2) * 100}
                      className="rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
                    >
                      <h3 className="mb-4 flex items-center gap-3 font-semibold text-foreground">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon size={18} className="text-primary" />
                        </span>
                        {skill.title}
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {skill.core.map((item) => (
                          <li
                            key={item}
                            className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                      {skill.also.length > 0 && (
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {t('alsoUsed')}:
                          </span>{' '}
                          {skill.also.join(' · ')}
                        </p>
                      )}
                    </Reveal>
                  );
                })}
              </div>
            </section>

            <section id="certifications" className="scroll-mt-28">
              <SectionTitle>{t('sections.certifications')}</SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2">
                {certifications.map((c, index) => (
                  <Reveal
                    key={c.title}
                    delay={index * 100}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card/60 p-5"
                  >
                    {hasBadgeImage(c.badge) ? (
                      <Image
                        src={c.badge}
                        alt=""
                        width={72}
                        height={72}
                        className="h-18 w-18 shrink-0"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <BadgeCheck size={20} className="text-primary" />
                      </span>
                    )}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {c.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {c.issuer} · {c.code} · {c.year}
                      </p>
                      <a
                        href={c.credlyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t('verifyLabel', {title: c.title})}
                        className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                        {...analyticsAttributes('certification_verified', {
                          link: c.trackingId
                        })}
                      >
                        {t('verify')}
                        <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

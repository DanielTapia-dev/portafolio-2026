import {
  BadgeCheck,
  Cloud,
  Database,
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
import {projects} from '@/lib/projects';
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

// Copy lives in messages under About.highlights.items.<id>.
// TODO(Daniel): add an outcome to falabella and factupro once there is one to cite.
const highlights = [
  {id: 'falabella', hasOutcome: false},
  {id: 'factupro', hasOutcome: false},
  {id: 'ingestion', hasOutcome: true},
  {id: 'recovery', hasOutcome: true}
] as const;

// year: null means the certification is still in progress.
const certifications: {title: string; issuer: string; year: string | null}[] = [
  {title: 'AWS Certified Cloud Practitioner', issuer: 'AWS', year: '2025'},
  {
    title: 'AWS Solutions Architect (Associate)',
    issuer: 'AWS',
    year: null
  }
];

// Periods, titles, summaries and highlights live in messages under About.experience.<id>.
const experience = [
  // TODO(Daniel): team size, one or two concrete architecture decisions and any
  // documented outcome would make this entry stronger. Nothing is invented here.
  {
    id: 'falabella',
    isCurrent: true,
    company: 'SmartJob · Falabella',
    techs: ['React', 'Fastify', 'Microfrontends', 'Design Systems', 'i18n']
  },
  {
    id: 'stafi',
    company: 'Stafi 🇺🇸',
    techs: ['Next.js', 'Nest.js', 'Microservices', 'Vercel', 'Postgres']
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
      techs: ['Next.js', 'NestJS', 'Fireblocks', 'Coinbase']
    }
  },
  {
    id: 'axle',
    company: 'MushroomSoft · Axle Informatics 🇺🇸',
    techs: [
      'Angular',
      'Microfrontends',
      'PrimeNG',
      'NestJS',
      'PostgreSQL',
      'MongoDB',
      'Azure DevOps'
    ]
  },
  {
    id: 'zeyo',
    company: 'Zeyo · Business Blockchain',
    techs: [
      'React',
      'Node.js',
      'Python',
      'AWS S3',
      'GitHub Actions',
      'Data Processing'
    ]
  },
  {
    id: 'kengisoft',
    company: 'Kengisoft',
    techs: ['Angular', 'Node.js', 'React', 'Spring Boot', 'WordPress', 'SQL']
  },
  {
    id: 'freelance-web',
    company: 'Freelance',
    techs: [
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
  'highlights',
  'experience',
  'skills',
  'certifications'
] as const;

const featuredCount = projects.filter((project) => project.featured).length;

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
    {value: String(featuredCount), label: t('stats.projects.label')},
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

            <section id="highlights" className="scroll-mt-28">
              <SectionTitle>{t('sections.highlights')}</SectionTitle>
              <div className="grid gap-5 md:grid-cols-2">
                {highlights.map(({id, hasOutcome}, index) => (
                  <Reveal
                    key={id}
                    delay={(index % 2) * 100}
                    className="flex flex-col rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-primary/40"
                  >
                    <p className="font-mono text-xs text-primary">
                      {t(`highlights.items.${id}.label`)}
                    </p>
                    <h3 className="mt-2 font-semibold leading-snug text-foreground">
                      {t(`highlights.items.${id}.title`)}
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm leading-relaxed">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {t('highlights.labels.context')}
                        </dt>
                        <dd className="mt-1 text-muted-foreground">
                          {t(`highlights.items.${id}.context`)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {t('highlights.labels.part')}
                        </dt>
                        <dd className="mt-1 text-foreground/90">
                          {t(`highlights.items.${id}.part`)}
                        </dd>
                      </div>
                      {hasOutcome && (
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                            {t('highlights.labels.outcome')}
                          </dt>
                          <dd className="mt-1 text-foreground/90">
                            {t(`highlights.items.${id}.outcome`)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </Reveal>
                ))}
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
                    className={cn(
                      'flex items-start gap-4 rounded-xl border border-border bg-card/60 p-5',
                      !c.year && 'border-dashed'
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <BadgeCheck size={20} className="text-primary" />
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {c.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {c.issuer} · {c.year ?? t('inProgress')}
                      </p>
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

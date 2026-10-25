import {getTranslations, setRequestLocale} from 'next-intl/server';
import type {Locale} from 'next-intl';
import ProfileAvatar from '@/app/components/ProfileAvatar';
import {SocialNetworks} from '@/app/components/SocialNertworks';

const skills = [
  {
    category: 'frontend',
    items: [
      'React',
      'Next.js',
      'TypeScript',
      'Angular',
      'Microfrontends',
      'SCSS Modules',
      'Tailwind CSS',
      'PrimeNG',
      'Bootstrap',
      'i18n'
    ]
  },
  {
    category: 'backend',
    items: [
      'Node.js',
      'NestJS',
      'Fastify',
      'Spring Boot',
      'REST APIs',
      'GraphQL',
      'Python'
    ]
  },
  {
    category: 'databases',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle', 'SQL Server', 'Redis']
  },
  {
    category: 'cloud',
    items: [
      'AWS (EC2, S3, IAM, RDS, Lambda)',
      'CloudFront',
      'Docker',
      'GitHub Actions',
      'CI/CD',
      'Vercel'
    ]
  },
  {
    category: 'tools',
    items: [
      'Git',
      'GitHub',
      'Azure DevOps',
      'Bitbucket',
      'Jira',
      'Figma',
      'Scrum',
      'Kanban'
    ]
  }
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

const experience = [
  {
    id: 'falabella',
    company: 'SmartJob · Falabella',
    techs: ['React', 'Fastify', 'Microfrontends', 'Design Systems', 'i18n']
  },
  {
    id: 'stafi',
    company: 'Stafi 🇺🇸',
    techs: ['Next.js', 'Nest.js', 'Microservices', 'Vercel', 'Postgres']
  },
  {
    id: 'software-architect',
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
    ]
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

const sections = ['bio', 'experience', 'skills', 'certifications'] as const;

export default async function AboutPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('About');

  return (
    <div className="min-h-screen pt-24 pb-16 scroll-smooth">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:h-fit space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {t('title')}
              </h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>

            <ProfileAvatar src="/Profile.jpg" alt={t('avatarAlt')} />

            <nav className="flex flex-row lg:flex-col gap-4">
              {sections.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="w-8 h-px bg-muted-foreground" />
                  {t(`sections.${id}`)}
                </a>
              ))}
            </nav>

            <div className="hidden lg:block">
              <SocialNetworks />
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-16">
            {/* Bio Section */}
            <section id="bio" className="space-y-6 scroll-mt-28">
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-foreground leading-relaxed">
                  {t('bio.intro')}
                </p>

                <br />

                <p className="text-muted-foreground leading-relaxed text-justify">
                  {t.rich('bio.current', {
                    highlight: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    )
                  })}
                </p>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  {t('bio.cloud')}
                </p>
              </div>
            </section>

            {/* Experience Section */}
            <section id="experience" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                {t('sections.experience')}
              </h2>
              <div className="space-y-8">
                {experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="group grid md:grid-cols-[160px_1fr] gap-4 p-4 -mx-4 rounded-lg hover:bg-card transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">
                      {t(`experience.${exp.id}.period`)}
                    </span>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {t(`experience.${exp.id}.title`)} ·{' '}
                        <span className="text-primary">{exp.company}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                        {t(`experience.${exp.id}.description`)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {exp.techs.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills Section */}
            <section id="skills" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                {t('skillsTitle')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {skills.map((skillGroup) => (
                  <div key={skillGroup.category} className="space-y-4">
                    <h3 className="font-medium text-foreground">
                      {t(`skillCategories.${skillGroup.category}`)}
                    </h3>
                    <ul className="space-y-2">
                      {skillGroup.items.map((skill) => (
                        <li
                          key={skill}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Certifications Section */}
            <section id="certifications" className="space-y-8 scroll-mt-28">
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                {t('sections.certifications')}
              </h2>
              <div className="space-y-4">
                {certifications.map((c) => (
                  <div
                    key={c.title}
                    className="flex items-start justify-between gap-4 p-4 -mx-4 rounded-lg hover:bg-card transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium text-foreground">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {c.issuer}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {c.year ?? t('inProgress')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Mobile Social */}
        <div className="mt-12 lg:hidden">
          <SocialNetworks />
        </div>
      </div>
    </div>
  );
}
